import { format as fnsFormat } from 'date-fns/esm';
import { zhCN } from 'date-fns/locale';

export const formatDate = (
  date: Date | string = new Date(),
  format: string = 'yyyy-MM-dd HH:mm:ss',
) => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return fnsFormat(date, format, {
    locale: zhCN,
  });
};

export const getParamsFromUrl = (name: string, url?: string) => {
  const targetUrl = url || window.location.hash;
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  let result: any =
    targetUrl.split('?').length > 1 ? targetUrl.split('?')[1].match(reg) : 0;
  if (result) {
    return result[2];
  }
  return null;
};

export const compare = (property: any, isDesc?: boolean) =>
  isDesc
    ? (b: any, a: any) => a[property] - b[property]
    : (a: any, b: any) => a[property] - b[property];

export const getDirection = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) => {
  let angx = endX - startX;
  let angy = endY - startY;

  if (Math.abs(angx) < 25 && Math.abs(angy) < 25) {
    return '';
  }

  let angle = (Math.atan2(angy, angx) * 180) / Math.PI;

  if (angle >= -135 && angle <= -45) {
    return 'toTop';
  } else if (angle > 45 && angle < 135) {
    return 'toDown';
  } else if (
    (angle >= 135 && angle <= 180) ||
    (angle >= -180 && angle < -135)
  ) {
    return 'toLeft';
  } else if (angle >= -45 && angle <= 45) {
    return 'toRight';
  }
  return '';
};

export const bindTouchDirection = (
  ref: any,
  callback: (direction: string) => void,
) => {
  if (!ref) {
    return callback('error');
  }
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;

  ref.addEventListener('touchstart', (e: any) => {
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
  });

  ref.addEventListener('touchend', (e: any) => {
    endX = e.changedTouches[0].pageX;
    endY = e.changedTouches[0].pageY;

    callback(getDirection(startX, startY, endX, endY));
  });
};
