export const shouldPromptAbandonment = (hasItems: boolean, timeIdleMinutes: number) => hasItems && timeIdleMinutes >= 15;
