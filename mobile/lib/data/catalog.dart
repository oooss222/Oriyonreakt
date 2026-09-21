class CategoryInfo {
  const CategoryInfo({
    required this.slug,
    required this.title,
    required this.shortTitle,
    required this.subs,
    this.hiddenFromHome = false,
  });

  final String slug;
  final String title;
  final String shortTitle;
  final List<String> subs;
  final bool hiddenFromHome;
}

List<String> _grouped(List<(String, List<String>)> groups) {
  return [
    for (final group in groups)
      for (final item in group.$2) "${group.$1} — $item",
    "Другое",
  ];
}

const cities = ["Душанбе", "Худжанд"];

const photoMax = {
  "phones": 5,
  "electronics": 5,
  "transport": 6,
  "computers": 6,
  "services": 5,
  "repair": 3,
  "realestate": 8,
  "furniture": 6,
  "food": 6,
  "kids": 6,
  "travel": 8,
  "clothing": 6,
  "construction": 6,
  "business": 6,
};

const photoMin = {
  "transport": 3,
  "realestate": 3,
  "services": 1,
  "repair": 1,
  "food": 1,
  "kids": 1,
  "travel": 1,
  "clothing": 1,
  "construction": 1,
  "business": 1,
};

int listingPhotoMax(String cat) => photoMax[cat] ?? 6;
int listingPhotoMin(String cat) => photoMin[cat] ?? 1;

const vipPlans = [
  (days: 1, price: 3),
  (days: 3, price: 7),
  (days: 5, price: 10),
  (days: 7, price: 15),
];

const topPlans = [
  (days: 1, price: 2),
  (days: 3, price: 4),
  (days: 5, price: 7),
  (days: 7, price: 11),
  (days: 10, price: 16),
  (days: 20, price: 25),
  (days: 30, price: 40),
];

final categories = <String, CategoryInfo>{
  "realestate": const CategoryInfo(
    slug: "realestate",
    title: "Недвижимость",
    shortTitle: "Недвижимость",
    subs: [
      "Новостройки",
      "Квартиры",
      "Комнаты",
      "Дома и коттеджи",
      "Участки",
      "Гаражи и парковки",
      "Коммерческая недвижимость",
    ],
  ),
  "transport": const CategoryInfo(
    slug: "transport",
    title: "Авто",
    shortTitle: "Авто",
    subs: [
      "Легковые авто",
      "Запчасти",
      "Грузовики и автобусы",
      "Мототранспорт",
      "Сельхозтехника",
      "Спецтехника",
      "Прицепы",
      "Шины и диски",
      "Автохимия и автомасла",
    ],
  ),
  "furniture": const CategoryInfo(
    slug: "furniture",
    title: "Мебель",
    shortTitle: "Мебель",
    subs: [
      "Мебель для спальни",
      "Офисная мебель",
      "Мебель для гостиной",
      "Мебель для прихожей",
      "Мебель на заказ",
    ],
  ),
  "phones": const CategoryInfo(
    slug: "phones",
    title: "Телефоны",
    shortTitle: "Телефоны",
    subs: ["Мобильные телефоны", "Планшеты", "Мобильные аксессуары"],
  ),
  "electronics": const CategoryInfo(
    slug: "electronics",
    title: "Бытовая техника",
    shortTitle: "Техника",
    subs: [
      "Техника для дома и кухни",
      "Видеонаблюдение и камеры",
      "Климатическая техника",
      "Обогреватели",
    ],
  ),
  "computers": const CategoryInfo(
    slug: "computers",
    title: "Компьютеры и оргтехника",
    shortTitle: "Компьютеры",
    subs: ["Ноутбуки", "ПК", "Приставки", "Принтеры и сканеры"],
  ),
  "services": const CategoryInfo(
    slug: "services",
    title: "Услуги",
    shortTitle: "Услуги",
    subs: [
      "Ремонт и строительство",
      "Красота и здоровье",
      "Образование и репетиторы",
      "IT и digital",
      "Юридические услуги",
      "Бухгалтерия и финансы",
      "Клининг и уборка",
      "Перевозки и грузчики",
      "Ремонт авто",
      "Ремонт телефонов и планшетов",
      "Ремонт компьютеров и бытовой техники",
      "Фото и видео",
      "Организация мероприятий",
      "Другое",
    ],
  ),
  "repair": const CategoryInfo(
    slug: "repair",
    title: "Ремонт",
    shortTitle: "Ремонт",
    hiddenFromHome: true,
    subs: ["Материалы", "Инструменты", "Другое"],
  ),
  "food": CategoryInfo(
    slug: "food",
    title: "Еда",
    shortTitle: "Еда",
    subs: _grouped(const [
      ("Выпечка и десерты", ["Самса", "Торты и десерты", "Лепёшки и хлеб", "Восточные сладости", "Другое"]),
      ("Блюда", ["Плов и национальная кухня", "Шашлык и гриль", "Домашние блюда", "Салаты и закуски", "Супы", "Завтраки", "Другое"]),
      ("Фастфуд", ["Шаурма", "Бургеры", "Пицца", "Другое"]),
      ("Полуфабрикаты / заморозка", ["Манты и пельмени", "Заморозка", "Тесто и заготовки", "Другое"]),
      ("Услуги повара", ["Домашний повар", "Кейтеринг", "На свадьбу и той", "Другое"]),
      ("Особое питание", ["Халяль", "Диетическое", "Другое"]),
    ]),
  ),
  "kids": CategoryInfo(
    slug: "kids",
    title: "Детский мир",
    shortTitle: "Детский мир",
    subs: _grouped(const [
      ("Для мальчиков", ["Одежда", "Обувь", "Школьная форма", "Другое"]),
      ("Для девочек", ["Одежда", "Обувь", "Школьная форма", "Другое"]),
      ("Для новорождённых", ["Одежда", "Уход", "Кормление", "Другое"]),
      ("Игрушки", ["Развивающие", "Конструкторы", "Куклы и мягкие", "Машинки и транспорт", "Настольные игры", "Другое"]),
      ("Коляски и автокресла", ["Коляски", "Автокресла", "Другое"]),
      ("Транспорт", ["Велосипеды и самокаты", "Электромобили", "Другое"]),
      ("Мебель", ["Кроватки", "Столы и стулья", "Шкафы и комоды", "Другое"]),
      ("Услуги", ["Няни", "Репетиторы", "Кружки и секции", "Другое"]),
    ]),
  ),
  "travel": CategoryInfo(
    slug: "travel",
    title: "Путешествия",
    shortTitle: "Путешествия",
    subs: _grouped(const [
      ("Туры по Таджикистану", ["Фанские горы", "Памир и Хорог", "Искандеркуль", "Семь озёр", "Худжанд и Согд", "Другие маршруты"]),
      ("Туры за границу", ["Узбекистан", "Турция", "ОАЭ", "Россия", "Другое"]),
      ("Экскурсии и гиды", ["Гиды", "Групповые экскурсии", "Индивидуальные", "Горные маршруты", "Другое"]),
      ("Базы отдыха", ["Базы и дома отдыха", "Горные домики", "Кемпинг и глэмпинг", "Другое"]),
      ("Транспорт и билеты", ["Аренда авто", "Авто с водителем", "Трансфер", "Авиа и ж/д билеты", "Другое"]),
      ("Снаряжение", ["Палатки и спальники", "Рюкзаки", "Альпинизм", "Другое"]),
    ]),
  ),
  "clothing": CategoryInfo(
    slug: "clothing",
    title: "Одежда",
    shortTitle: "Одежда",
    subs: _grouped(const [
      ("Для свадьбы", ["Платья", "Костюмы", "Национальная", "Другое"]),
      ("Женщинам", ["Платья", "Блузки и рубашки", "Брюки и джинсы", "Верхняя одежда", "Спортивная", "Другое"]),
      ("Мужчинам", ["Рубашки и футболки", "Брюки и джинсы", "Костюмы", "Верхняя одежда", "Спортивная", "Другое"]),
      ("Национальная одежда", ["Курта", "Чапан", "Национальные платья", "Костюмы", "Другое"]),
      ("Обувь", ["Женская", "Мужская", "Кроссовки", "Сезонная", "Другое"]),
      ("Сумки и чемоданы", ["Сумки", "Рюкзаки", "Чемоданы", "Другое"]),
      ("Аксессуары", ["Головные уборы", "Ремни и кошельки", "Очки", "Другое"]),
      ("Ювелирные украшения", ["Кольца", "Серьги", "Цепочки", "Другое"]),
      ("Ткани", ["Атлас и адрас", "Метраж", "Другое"]),
    ]),
  ),
  "construction": CategoryInfo(
    slug: "construction",
    title: "Строительство",
    shortTitle: "Строительство",
    subs: _grouped(const [
      ("Материалы", ["Цемент и сыпучие", "Кирпич и блоки", "Отделка", "Кровля", "Другое"]),
      ("Окна и двери", ["Окна ПВХ", "Двери", "Ворота", "Другое"]),
      ("Электрика", ["Кабели и провода", "Розетки и свет", "Щиты и оборудование", "Другое"]),
      ("Сантехника", ["Трубы и смесители", "Ванны и кабины", "Водонагреватели", "Другое"]),
      ("Инструменты", ["Электроинструмент", "Ручной инструмент", "Другое"]),
      ("Аренда техники", ["Экскаваторы и погрузчики", "Бетономешалки", "Генераторы", "Другая техника"]),
      ("Услуги мастеров", ["Ремонт квартир", "Строительство домов", "Электрика и сантехника", "Отделочные работы", "Другое"]),
      ("Проектирование", ["Архитектура", "Дизайн интерьера", "Другое"]),
    ]),
  ),
  "business": CategoryInfo(
    slug: "business",
    title: "Все для бизнеса",
    shortTitle: "Бизнес",
    subs: _grouped(const [
      ("Бизнес на продажу", ["Торговля, магазины", "Кафе, рестораны, общепит", "Производство, фабрики", "Автосервисы, автомойки, шиномонтаж", "Салоны красоты", "Фермы, сады", "Интернет, сайты, домены", "Развлекательные аттракционы", "Другое"]),
      ("Оборудование", ["Для магазина", "Для кафе и ресторана", "Для салона красоты", "Для автосервиса и автомоек", "Пищевое производство", "Промышленное", "Строительное", "Медицинское", "Электрооборудование", "Бочки, цистерны, ёмкости", "Терминалы / кассовые аппараты", "Полиграфия", "Другое"]),
      ("Сырьё и материалы", ["Пищевое сырьё", "Упаковка", "Для производства", "Химия и расходники", "Другое"]),
      ("Готовый бизнес в аренду", ["Торговля, магазины", "Кафе, рестораны, общепит", "Автосервисы, автомойки", "Салоны красоты", "Производство", "Другое"]),
    ]),
  ),
};

List<CategoryInfo> get homeCategories =>
    categories.values.where((item) => !item.hiddenFromHome).toList();

const homeShowcaseSlugs = [
  "realestate",
  "transport",
  "phones",
  "furniture",
  "travel",
  "food",
];

List<CategoryInfo> get homeShowcaseCategories => [
      for (final slug in homeShowcaseSlugs)
        if (categories[slug] != null) categories[slug]!,
    ];

/// Featured six first, then the rest of the catalog — used by the home pager.
List<CategoryInfo> get homeFeedCategories {
  final featured = homeShowcaseCategories;
  final seen = featured.map((item) => item.slug).toSet();
  return [
    ...featured,
    ...homeCategories.where((item) => seen.add(item.slug)),
  ];
}

String categoryTitle(String slug) => categories[slug]?.title ?? slug;

/// Subcategory chips inside a category. Grouped catalogs (food, kids, …)
/// expose the group name; the API expands it to every item in that group.
List<String> categoryBrowseSubs(String slug) {
  final cat = categories[slug];
  if (cat == null) return const [];
  final groups = <String>[];
  final seen = <String>{};
  for (final sub in cat.subs) {
    final sep = sub.indexOf(" — ");
    if (sep <= 0) continue;
    final group = sub.substring(0, sep);
    if (seen.add(group)) groups.add(group);
  }
  if (groups.isNotEmpty) return groups;
  return cat.subs;
}

const categoryImageFiles = <String, String>{
  "realestate": "realestate.png",
  "transport": "car.png",
  "furniture": "furniture.png",
  "phones": "phone.png",
  "electronics": "electronics.png",
  "computers": "computers.png",
  "services": "services.png",
  "repair": "repair.png",
  "food": "food.png",
  "kids": "kids.png",
  "travel": "travel.png",
  "clothing": "clothing.png",
  "construction": "construction.png",
  "business": "business.png",
};

String categoryImagePath(String slug) =>
    "/img/${categoryImageFiles[slug] ?? "$slug.png"}";

const listingStatusLabels = <String, String>{
  "approved": "Активно",
  "pending": "На модерации",
  "moderation": "На модерации",
  "rejected": "Отклонено",
  "archived": "Архив",
  "sold": "Продано",
  "draft": "Черновик",
};

String listingStatusLabel(String status) =>
    listingStatusLabels[status] ?? status;
