import { loadFullSchedule } from '@/lib/server/schedule-repo';
import { signCleanDutyPhotoUrls } from '@/lib/server/supabase-storage';

export async function loadScheduleForClient() {
  const data = await loadFullSchedule();
  const cleanDuties = await Promise.all(
    data.cleanDuties.map((d) => signCleanDutyPhotoUrls(d))
  );
  return { ...data, cleanDuties };
}
