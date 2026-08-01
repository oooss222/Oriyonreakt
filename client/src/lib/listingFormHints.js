import { TITLE_MAX } from "../data/listingCategories";

export function getSpecValue(specs, name) {
  return specs.find((row) => row.name === name)?.value?.trim() || "";
}

export function getDescriptionPlaceholder(cat) {
  const map = {
    transport:
      "Укажите год, пробег, состояние, комплектацию, историю обслуживания и причину продажи.",
    phones:
      "Опишите состояние экрана и корпуса, ёмкость аккумулятора, комплект (коробка, зарядка) и гарантию.",
    electronics:
      "Расскажите о состоянии, комплектации, сроке использования и причинах продажи.",
    computers:
      "Укажите характеристики, состояние, комплектацию, срок использования и гарантию.",
    furniture:
      "Опишите материал, размеры, состояние, возможность доставки или самовывоза.",
    repair: "Опишите услугу, опыт, сроки выполнения и зону работы.",
  };

  return (
    map[cat] ||
    "Опишите товар, состояние, комплектацию и условия сделки."
  );
}

export function getTitlePlaceholder(cat, subcategory) {
  const map = {
    transport: "Toyota Camry 2018, 2.5 AT",
    phones: "Apple iPhone 14 Pro 256GB",
    electronics: "Samsung стиральная машина 7 кг",
    computers: "Lenovo ThinkPad i5 16GB",
    furniture: subcategory || "Диван угловой, бежевый",
    repair: "Ремонт телефонов и ноутбуков",
  };

  return map[cat] || "Кратко опишите, что продаёте";
}

export function buildSuggestedTitle(form, specs) {
  const parts = [];

  if (form.cat === "transport") {
    const brand = getSpecValue(specs, "Марка");
    const model = getSpecValue(specs, "Модель");
    const year = getSpecValue(specs, "Год");
    if (brand) parts.push(brand);
    if (model) parts.push(model);
    if (year) parts.push(year);
  } else if (form.cat === "phones") {
    const brand = getSpecValue(specs, "Производитель");
    const model = getSpecValue(specs, "Модель");
    const memory = getSpecValue(specs, "Память");
    if (brand) parts.push(brand);
    if (model) parts.push(model);
    if (memory) parts.push(memory);
  } else if (form.cat === "computers") {
    const brand = getSpecValue(specs, "Бренд");
    const model = getSpecValue(specs, "Модель");
    if (brand) parts.push(brand);
    if (model) parts.push(model);
  } else if (form.cat === "electronics") {
    const brand = getSpecValue(specs, "Бренд");
    const type = getSpecValue(specs, "Тип");
    if (brand) parts.push(brand);
    if (type) parts.push(type);
  } else if (form.subcategory) {
    parts.push(form.subcategory);
  }

  if (form.location && parts.length < 3) {
    parts.push(form.location);
  }

  return parts.join(" ").trim().slice(0, TITLE_MAX);
}
