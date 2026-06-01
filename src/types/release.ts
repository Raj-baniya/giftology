export interface ReleaseCandidate {
  version: string;
  buildNumber: number;
  testedBy: string;
  signOffDate: string;
  status: 'PENDING' | 'APPROVED';
}
