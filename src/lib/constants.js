export const ORGANIZATION_TYPES = {
  COMMERCIAL: 'Коммерческая',
  PUBLIC: 'Публичная',
  GOVERNMENT: 'Государственная',
  TRUST: 'Траст',
  PRIVATE_LIMITED_COMPANY: 'ООО',
  OPEN_JOINT_STOCK_COMPANY: 'ОАО',
};

export const getTypeName = (type) => ORGANIZATION_TYPES[type] || type || '—';

