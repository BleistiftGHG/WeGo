import { supabase } from '@/lib/supabase';

export type Message = {
  id: string;
  ride_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ChatRide = {
  id: string;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
};

const MESSAGE_FIELDS = 'id, ride_id, sender_id, body, created_at';

export async function fetchRide(rideId: string): Promise<ChatRide | null> {
  const { data } = await supabase
    .from('rides')
    .select('id, driver_id, origin_name, destination_name, departure_time')
    .eq('id', rideId)
    .single();
  return (data as ChatRide | null) ?? null;
}

export async function fetchMessages(rideId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select(MESSAGE_FIELDS)
    .eq('ride_id', rideId)
    .order('created_at', { ascending: false })
    .limit(200);
  return (data as Message[]) ?? [];
}

export async function sendMessage(
  rideId: string,
  senderId: string,
  body: string,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ ride_id: rideId, sender_id: senderId, body })
    .select(MESSAGE_FIELDS)
    .single();
  return error ? null : (data as Message);
}

export async function fetchChatRides(userId: string, rideIds: string[]): Promise<ChatRide[]> {
  if (rideIds.length === 0) return [];
  const { data } = await supabase
    .from('rides')
    .select('id, driver_id, origin_name, destination_name, departure_time')
    .in('id', rideIds)
    .order('departure_time', { ascending: false });
  return (data as ChatRide[]) ?? [];
}

export async function fetchLastMessages(rideIds: string[]): Promise<Record<string, Message>> {
  if (rideIds.length === 0) return {};
  const { data } = await supabase
    .from('messages')
    .select(MESSAGE_FIELDS)
    .in('ride_id', rideIds)
    .order('created_at', { ascending: false })
    .limit(300);
  const last: Record<string, Message> = {};
  for (const m of (data as Message[]) ?? []) {
    if (!last[m.ride_id]) last[m.ride_id] = m;
  }
  return last;
}