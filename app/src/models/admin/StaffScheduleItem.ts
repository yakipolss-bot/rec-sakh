export interface StaffScheduleItem {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shift: 'morning' | 'day' | 'night';
}
