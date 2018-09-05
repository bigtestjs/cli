import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import logger from '@util/logger';

export { expect } from 'chai';
export { when } from '@bigtest/convergence';

export { default as request } from '@run/util/request';

export { default as defer } from './defer';
export { default as dedent } from './dedent';
export { default as readFile } from './read-file';

// use chai-as-promised
chai.use(chaiAsPromised);

// silence the global logger
logger.level = 'silent';
