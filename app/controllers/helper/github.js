import dateHelper from '../../utils/date';
import logger from '../../utils/logger';

const { getMonth, getDateBySeconds } = dateHelper;
const BASE_DAYS = [0, 0, 0, 0, 0, 0, 0];

export const combineReposCommits = (reposCommits) => {
  const result = {
    commits: [],
    total: 0,
    // average of every weekday commit, from sunday to monday
    dailyCommits: [],
    // sum of every weekday commit, from sunday to monday
    totalDailyCommits: [
      // each item menus from sunday to monday
      // total commits count combine by all repos
      // 200, 201, 100, 198, 110, 150, 111
    ],
    monthReview: {
      // 1 to 12 month, each month commits count & new repos count
      // 1: { repos: [xxx, yyy], commitsCount: xxx }
    }
  };

  if (!reposCommits.length) {
    logger.error('[COMMITS:EMPTY]');
    return result;
  }

  const commitsTmp = {};
  const dailyCommitsTmp = {};

  // initial monthReview
  for (let i = 1; i < 13; i += 1) {
    dailyCommitsTmp[(i - 1) % 7] = {
      total: 0,
      avg: 0,
      commits: []
    };
    result.monthReview[i] = {
      repos: [],
      commitsCount: 0
    };
  }

  for (const repository of reposCommits) {
    const { created_at, commits, name } = repository;
    const month = getMonth(created_at);
    result.monthReview[month].repos.push(name);

    for (let i = 0; i < commits.length; i += 1) {
      const commit = commits[i];
      const { total, days, week } = commit;
      result.total += total;

      if (commitsTmp[week] === undefined) {
        commitsTmp[week] = {
          week,
          total: 0,
          days: [...BASE_DAYS],
        }
      }
      commitsTmp[week].total += total;
      days.forEach((dayCommit, index) => {
        commitsTmp[week].days[index] += dayCommit;

        if (dayCommit) {
          dailyCommitsTmp[index].total += dayCommit;
          const average = dailyCommitsTmp[index].avg;
          const len = dailyCommitsTmp[index].commits.length;
          dailyCommitsTmp[index].avg = ((average * len) + dayCommit) / (len + 1);
          dailyCommitsTmp[index].commits.push(dayCommit)
        }

        const daySeconds = week - ((7 - index) * 24 * 60 * 60);
        const targetMonth = getDateBySeconds(daySeconds, 'M');
        result.monthReview[targetMonth].commitsCount += dayCommit;
      });
    }
  }

  for (const weekday of Object.keys(dailyCommitsTmp)) {
    result.dailyCommits.push(dailyCommitsTmp[weekday].avg);
    result.totalDailyCommits.push(dailyCommitsTmp[weekday].total);
  }

  result.commits = Object.keys(commitsTmp).map(week => commitsTmp[week]);
  return result;
};

export const getReposLanguages = (repos) => {
  const languages = [];

  for (const repository of repos) {
    const { language } = repository;
    if (!languages.some(item => item === language)) {
      language && languages.push(language);
    }
  }
  return languages;
};

export const UPDATE_STATUS_TEXT = {
  1: 'messages.update.succeed',
  // 2: 'messages.update.pending',
  // 3: 'messages.update.running',
  4: 'messages.update.failed',
  5: 'messages.update.frequently',
};
