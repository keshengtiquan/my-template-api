import * as crypto from 'crypto';

export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}
export function formatDate(date: Date, format: string) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  format = format.replace('YYYY', String(year));
  format = format.replace('MM', month);
  format = format.replace('DD', day);
  format = format.replace('HH', hours);
  format = format.replace('mm', minutes);
  format = format.replace('ss', seconds);

  return format;
}
