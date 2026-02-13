/**
 * Points service tests
 */
import { mockSupabase } from '../../__mocks__/supabaseMock';

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

import {
  POINTS,
  awardPoints,
  awardResponsePoints,
  getPointsSummary,
  emitPointsAwarded,
  onPointsAwarded,
} from '../../lib/services/pointsService';

describe('Points Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  describe('POINTS constants', () => {
    it('has correct point values', () => {
      expect(POINTS.RESPONSE).toBe(3);
      expect(POINTS.PHOTO_BONUS).toBe(1);
      expect(POINTS.FIRST_RESPONDER).toBe(1);
      expect(POINTS.QUIPLASH_WIN).toBe(5);
      expect(POINTS.PERFECT_WEEK).toBe(10);
    });
  });

  describe('awardPoints', () => {
    it('calls rpc with correct parameters', async () => {
      const result = await awardPoints('response', 'group-1', 'ref-1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('award_points', {
        p_user_id: 'test-user-id',
        p_event_type: 'response',
        p_points: POINTS.RESPONSE,
        p_group_id: 'group-1',
        p_reference_id: 'ref-1',
      });
      expect(result.success).toBe(true);
      expect(result.points).toBe(POINTS.RESPONSE);
    });

    it('returns error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      const result = await awardPoints('response');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    it('handles RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed' },
      });
      const result = await awardPoints('response');
      expect(result.success).toBe(false);
      expect(result.error).toBe('RPC failed');
    });

    it('awards correct points for each event type', async () => {
      const eventTypes = [
        { type: 'response' as const, expected: POINTS.RESPONSE },
        { type: 'photo_bonus' as const, expected: POINTS.PHOTO_BONUS },
        { type: 'quiplash_win' as const, expected: POINTS.QUIPLASH_WIN },
        { type: 'perfect_week' as const, expected: POINTS.PERFECT_WEEK },
        { type: 'streak_bonus' as const, expected: POINTS.STREAK_BONUS },
      ];

      for (const { type, expected } of eventTypes) {
        mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
        const result = await awardPoints(type);
        expect(result.points).toBe(expected);
      }
    });
  });

  describe('awardResponsePoints', () => {
    it('awards base response points', async () => {
      const result = await awardResponsePoints('group-1', 'response-1', false);
      expect(result.totalPoints).toBe(POINTS.RESPONSE);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('awards photo bonus when applicable', async () => {
      const result = await awardResponsePoints('group-1', 'response-1', true);
      expect(result.totalPoints).toBe(POINTS.RESPONSE + POINTS.PHOTO_BONUS);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPointsSummary', () => {
    it('returns summary from RPC', async () => {
      const mockSummary = {
        total_points: 100,
        weekly_points: 20,
        current_streak: 3,
        longest_streak: 7,
        recent_events: [],
      };
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockSummary, error: null });

      const result = await getPointsSummary();
      expect(result).toEqual(mockSummary);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_points_summary');
    });

    it('returns null on error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });
      const result = await getPointsSummary();
      expect(result).toBeNull();
    });
  });

  describe('event emitter', () => {
    it('emits and receives point events', () => {
      const listener = jest.fn();
      const unsubscribe = onPointsAwarded(listener);

      emitPointsAwarded(5, 'response');
      expect(listener).toHaveBeenCalledWith(5, 'response');

      unsubscribe();
      emitPointsAwarded(10, 'quiplash_win');
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });
});
