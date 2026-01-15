import { getTimelineStep } from '../../src/utils/timelineHelpers';
describe('Timeline Progression', () => {
  it('gives step 5 for DELIVERED', () => {
    expect(getTimelineStep('DELIVERED')).toBe(5);
  });
});
