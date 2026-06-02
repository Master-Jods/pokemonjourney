import { supabase } from '../supabaseClient';
import { addHistoryLog } from './history';
import { getPlayerCoins, updatePlayerCoins } from './players';
import { evolvePokemon as updateEvolution } from './pokemon';
import { InventoryItem, InventoryRow, mapInventoryItem, OwnedPokemon, StoreItemRow } from '../types';

async function getStoreItemByName(itemName: string): Promise<StoreItemRow> {
  const { data, error } = await supabase
    .from('store_items')
    .select()
    .ilike('item_name', itemName.trim())
    .single<StoreItemRow>();

  if (error) {
    throw new Error(`Failed to load store item "${itemName}": ${error.message}`);
  }

  return data;
}

async function getInventoryRow(playerId: string, itemId: number): Promise<InventoryRow | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select()
    .eq('player_id', playerId)
    .eq('item_id', itemId)
    .maybeSingle<InventoryRow>();

  if (error) {
    throw new Error(`Failed to load inventory item: ${error.message}`);
  }

  return data;
}

async function saveInventoryQuantity(
  playerId: string,
  item: StoreItemRow,
  quantity: number,
): Promise<InventoryItem> {
  const existing = await getInventoryRow(playerId, item.id);
  const nextQuantity = Math.max(0, Math.trunc(quantity));

  if (existing) {
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: nextQuantity })
      .eq('id', existing.id)
      .select()
      .single<InventoryRow>();

    if (error) {
      throw new Error(`Failed to update inventory item: ${error.message}`);
    }

    return mapInventoryItem(data, item.item_name);
  }

  const { data, error } = await supabase
    .from('inventory')
    .insert({
      player_id: playerId,
      item_id: item.id,
      quantity: nextQuantity,
    })
    .select()
    .single<InventoryRow>();

  if (error) {
    throw new Error(`Failed to create inventory item: ${error.message}`);
  }

  return mapInventoryItem(data, item.item_name);
}

/**
 * Buys an item: check wallets, deduct coins, add item quantity, then log purchase.
 */
export async function buyStoreItem(playerId: string, itemName: string, price?: number): Promise<InventoryItem> {
  const item = await getStoreItemByName(itemName);
  const itemPrice = price ?? item.price;
  const currentCoins = await getPlayerCoins(playerId);

  if (currentCoins < itemPrice) {
    throw new Error(`Not enough coins to buy ${item.item_name}.`);
  }

  const existing = await getInventoryRow(playerId, item.id);
  await updatePlayerCoins(playerId, -Math.abs(itemPrice), 'Pokemon Store', 'store');
  const inventoryItem = await saveInventoryQuantity(playerId, item, (existing?.quantity ?? 0) + 1);

  await addHistoryLog({
    playerId,
    gameName: 'Pokemon Store',
    result: 'purchased',
    coinsEarned: -Math.abs(itemPrice),
    sourceSystem: 'store',
    loggedBy: `Bought ${item.item_name}.`,
  });

  return inventoryItem;
}

/**
 * Consumes inventory safely. Quantity never drops below zero.
 */
export async function consumeInventoryItem(
  playerId: string,
  itemName: string,
  quantity = 1,
  reason = 'Inventory',
): Promise<InventoryItem> {
  const item = await getStoreItemByName(itemName);
  const existing = await getInventoryRow(playerId, item.id);
  const amount = Math.max(1, Math.trunc(quantity));

  if (!existing || existing.quantity < amount) {
    throw new Error(`Not enough ${item.item_name} in inventory.`);
  }

  const inventoryItem = await saveInventoryQuantity(playerId, item, existing.quantity - amount);

  await addHistoryLog({
    playerId,
    gameName: reason,
    result: 'item consumed',
    sourceSystem: 'main_system',
    loggedBy: `Used ${amount} ${item.item_name}.`,
  });

  return inventoryItem;
}

/**
 * Full evolution workflow: consume the required stone, update Pokemon species,
 * and write history for both inventory use and evolution.
 */
export async function evolvePokemon(
  playerId: string,
  ownedPokemonId: string,
  newPokemonDataId: string | number,
  stoneName: string,
): Promise<OwnedPokemon> {
  await consumeInventoryItem(playerId, stoneName, 1, 'Evolution');
  return updateEvolution(playerId, ownedPokemonId, newPokemonDataId, stoneName, 'main_system');
}

