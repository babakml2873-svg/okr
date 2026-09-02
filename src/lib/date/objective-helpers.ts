import { expectedProgress } from '@/lib/okr'

export { formatDate } from './format'

/** Progress a linear pace would have reached by now inside a quarter. */
export function expectedProgressForQuarter(quarter: { startDate: Date; endDate: Date }): number {
  return Math.round(expectedProgress(quarter.startDate, quarter.endDate))
}
