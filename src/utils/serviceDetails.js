import { listingTypes, priceUnits } from '../constants/services.js';

export function normalizeSriLankanPhone(value) {
  const compact = String(value || '').trim().replace(/[\s()-]/g, '');
  if (/^0[1-9]\d{8}$/.test(compact)) return '+94' + compact.slice(1);
  if (/^\+94[1-9]\d{8}$/.test(compact)) return compact;
  if (/^0094[1-9]\d{8}$/.test(compact)) return '+' + compact.slice(2);
  return '';
}
export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
export function validateService(values) {
  const title = values.title?.trim() || '';
  const description = values.description?.trim() || '';
  const student_name = values.student_name?.trim() || '';
  const availability = values.availability?.trim() || '';
  const contactEmail = values.contactEmail?.trim().toLowerCase() || '';
  const contactPhone = normalizeSriLankanPhone(values.contactPhone);
  const budget = Number(values.budget);
  if (!title || title.length > 120 || !description || description.length > 4000) {
    throw new Error('Enter a service title (up to 120 characters) and describe what you offer (up to 4000 characters).');
  }
  if (!Number.isFinite(budget) || budget < 1) throw new Error('Enter a price of at least Rs. 1.');
  if (!student_name || student_name.length > 80) throw new Error('Enter the provider name (up to 80 characters).');
  if (!isValidEmail(contactEmail)) throw new Error('Enter a valid contact email address.');
  if (!contactPhone) throw new Error('Enter a Sri Lankan phone number: 0771234567 or +94771234567. Landline numbers are also accepted.');
  if (!listingTypes.includes(values.listingType) || !priceUnits.includes(values.priceUnit)) {
    throw new Error('Choose a listing type and a price unit.');
  }
  if (!values.category?.trim()) throw new Error('Choose a category.');
  if (availability.length > 160) throw new Error('Keep availability to 160 characters.');
  return { title, description, category: values.category.trim(), budget, student_name,
    listingType: values.listingType, priceUnit: values.priceUnit, availability, contactEmail, contactPhone };
}

// The existing web API only stores its original fields. Keep these extra
// details in a readable description footer so they survive on older servers.
const footer = '\n\n--- UniTask service details ---\n';
const oneLine = value => String(value || '').replace(/\s+/g, ' ').trim();
export function toApiService(service) {
  const details = [
    'Listing type: ' + service.listingType,
    'Price unit: ' + service.priceUnit,
    'Availability: ' + oneLine(service.availability),
    'Provider: ' + oneLine(service.student_name),
  ].join('\n');
  return { title: service.title, description: service.description + footer + details,
    category: service.category, budget: service.budget,
    contactEmail: service.contactEmail, contactPhone: service.contactPhone };
}
export function readApiService(task) {
  const description = String(task.description || '');
  const offset = description.lastIndexOf(footer);
  if (offset < 0) return {};
  const match = description.slice(offset + footer.length).match(/^Listing type: (Service|Course|Class)\nPrice unit: (Per hour|Per class|Per course|Per project|Per session)\nAvailability: ([^\n]*)\nProvider: ([^\n]+)$/);
  if (!match) return {};
  return { description: description.slice(0, offset), listingType: match[1], priceUnit: match[2],
    availability: match[3], student_name: match[4] };
}
