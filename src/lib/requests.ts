import { supabase } from '@/lib/supabase';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type RideRequest = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: RequestStatus;
  created_at: string;
};

export async function fetchRequests(): Promise<RideRequest[]> {
  const { data } = await supabase
    .from('ride_requests')
    .select('id, ride_id, passenger_id, status, created_at')
    .order('created_at', { ascending: true });
  return (data as RideRequest[]) ?? [];
}

async function call(fn: string, args: Record<string, unknown>): Promise<boolean> {
  const { data, error } = await supabase.rpc(fn, args);
  return !error && data === 'ok';
}

export const requestRide = (rideId: string) => call('request_ride', { p_ride_id: rideId });

export const respondToRequest = (requestId: string, accept: boolean) =>
  call('respond_to_request', { p_request_id: requestId, p_accept: accept });

export const cancelRequest = (requestId: string) =>
  call('cancel_request', { p_request_id: requestId });