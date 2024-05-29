import type { BeanCollection, BeanName } from './context';
import type { GenericBean } from './genericBean';

export interface Bean extends GenericBean<BeanName, BeanCollection> {}
