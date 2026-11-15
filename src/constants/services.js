export const listingTypes = ['Service', 'Course', 'Class'];
export const priceUnits = ['Per hour', 'Per class', 'Per course', 'Per project', 'Per session'];
export function formatPrice(service) {
  const unit = service.priceUnit || 'Per project';
  return `Rs. ${Number(service.budget).toLocaleString('en-LK')} / ${unit.replace(/^Per /, '').toLowerCase()}`;
}
