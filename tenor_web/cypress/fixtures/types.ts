export interface TestProjectInfo {
  name: string;
  description: string;
}

export interface TestUserStory {
  title: string;
  description: string;
  acceptanceCriteria: string;
}

export interface TestIssue {
  title: string;
  description: string;
  stepsToRecreate: string;
}

export interface TestEpic {
  title: string;
  description: string;
}