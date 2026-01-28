import { getDayGreeting } from '../../src/utils/greeting';
describe('Greeting Helper', () => {
  it('morning before 12', () => expect(getDayGreeting(9)).toBe('Good Morning'));
  it('evening after 17', () => expect(getDayGreeting(19)).toBe('Good Evening'));
});
