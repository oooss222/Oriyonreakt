class SpecFieldDef {
  const SpecFieldDef({
    required this.name,
    this.type = "text",
    this.options = const [],
    this.dependsOn = "",
    this.optionsFrom,
    this.placeholder = "",
    this.whenName = "",
    this.whenValues = const [],
  });

  final String name;
  final String type;
  final List<String> options;
  final String dependsOn;
  final Map<String, List<String>>? optionsFrom;
  final String placeholder;
  final String whenName;
  final List<String> whenValues;

  bool visibleFor(Map<String, String> values) {
    if (whenName.isEmpty) return true;
    final current = values[whenName]?.trim() ?? "";
    if (current.isEmpty) return false;
    return whenValues.contains(current);
  }
}

class SpecDraft {
  SpecDraft({required this.def, this.value = ""});

  SpecFieldDef def;
  String value;

  String get name => def.name;
}

String _group(String subcategory) {
  final sub = subcategory.trim();
  final sep = sub.indexOf(" — ");
  return sep > 0 ? sub.substring(0, sep) : sub;
}

String _item(String subcategory) {
  final sub = subcategory.trim();
  final sep = sub.indexOf(" — ");
  return sep > 0 ? sub.substring(sep + 3) : "";
}

List<String> get _years => [for (var y = 2026; y >= 1990; y--) "$y"];
List<String> get _buildYears => [for (var y = 2026; y >= 1970; y--) "$y"];

const _condition = ["Новый", "Б/у"];
const _warranty = ["Да", "Нет"];
const _color = [
  "Белый",
  "Чёрный",
  "Серый",
  "Серебристый",
  "Синий",
  "Красный",
  "Зелёный",
  "Бежевый",
  "Коричневый",
  "Другой",
];
const _clothingCondition = ["Новое с биркой", "Новое", "Отличное", "Хорошее", "Б/у"];
const _serviceFormat = ["На выезде", "У клиента", "В офисе", "Онлайн"];
const _serviceExperience = ["до 1 года", "1–3 года", "3–5 лет", "5+ лет"];
const _rooms = ["1", "2", "3", "4", "5", "5+"];
const _kidsAges = ["0–1 год", "1–3 года", "3–6 лет", "6–12 лет", "12+"];
const _dushanbeDistricts = [
  "Центр",
  "Сино",
  "Фирдавси",
  "Шохмансур",
  "Исмоил Сомони",
  "Варзоб",
  "Рудаки",
  "Другой",
];
const _khujandDistricts = ["Центр", "Восточный", "Согдийский", "19-й микрорайон", "Другой"];

const _realEstateDailySubs = {"Квартиры", "Комнаты", "Дома и коттеджи"};
const _realEstateNoDailySubs = {
  "Новостройки",
  "Участки",
  "Гаражи и парковки",
  "Коммерческая недвижимость",
};

List<String> realEstateDealsFor(String subcategory) {
  if (_realEstateNoDailySubs.contains(subcategory.trim())) {
    return const ["Купить", "Снять"];
  }
  return const ["Купить", "Снять", "Посуточно"];
}

bool realEstateSubFitsDeal(String subcategory, String deal) {
  if (deal != "Посуточно") return true;
  if (subcategory.trim().isEmpty) return true;
  return _realEstateDailySubs.contains(subcategory.trim());
}

List<String> filterBrowseSubs(String cat, List<String> subs, Map<String, String> specs) {
  if (cat != "realestate") return subs;
  final deal = specs["Тип сделки"] ?? "";
  return [for (final sub in subs) if (realEstateSubFitsDeal(sub, deal)) sub];
}

List<String> districtsForCity(String city) {
  return switch (city.trim()) {
    "Худжанд" => _khujandDistricts,
    _ => _dushanbeDistricts,
  };
}

const _rentTerm = SpecFieldDef(
  name: "Срок аренды",
  type: "select",
  options: ["От 1 месяца", "От 3 месяцев", "От 6 месяцев", "От 1 года", "Любой"],
  whenName: "Тип сделки",
  whenValues: ["Снять"],
);
const _deposit = SpecFieldDef(
  name: "Залог",
  type: "select",
  options: ["Есть", "Нет", "По договорённости"],
  whenName: "Тип сделки",
  whenValues: ["Снять"],
);
const _guests = SpecFieldDef(
  name: "Гостей",
  type: "select",
  options: ["1", "2", "3", "4", "5", "6", "7", "8+"],
  whenName: "Тип сделки",
  whenValues: ["Посуточно"],
);
const _pets = SpecFieldDef(
  name: "Животные",
  type: "select",
  options: ["Можно", "Нельзя", "По договорённости"],
  whenName: "Тип сделки",
  whenValues: ["Снять", "Посуточно"],
);

const _phoneBrands = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Redmi",
  "POCO",
  "Huawei",
  "Honor",
  "Realme",
  "Tecno",
  "Infinix",
  "Oppo",
  "Vivo",
  "Другой",
];

const _phoneModels = {
  "Apple": [
    "iPhone SE",
    "iPhone 11",
    "iPhone 12",
    "iPhone 13",
    "iPhone 13 Pro",
    "iPhone 14",
    "iPhone 14 Pro",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 16",
    "iPhone 16 Pro",
    "Другая",
  ],
  "Samsung": [
    "Galaxy A15",
    "Galaxy A25",
    "Galaxy A35",
    "Galaxy A55",
    "Galaxy S23",
    "Galaxy S24",
    "Galaxy S25",
    "Galaxy Z Flip",
    "Galaxy Z Fold",
    "Другая",
  ],
  "Xiaomi": ["Redmi Note 13", "Redmi Note 14", "Redmi 13C", "POCO X6", "POCO F6", "Xiaomi 14", "Другая"],
  "Redmi": ["Redmi Note 13", "Redmi Note 14", "Redmi 13C", "Redmi 14C", "Другая"],
  "POCO": ["POCO X5", "POCO X6", "POCO F5", "POCO F6", "POCO M6", "Другая"],
};

const _carBrands = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Nissan",
  "Chevrolet",
  "Mercedes-Benz",
  "BMW",
  "Volkswagen",
  "Lexus",
  "Mazda",
  "Mitsubishi",
  "BYD",
  "Chery",
  "Geely",
  "Lada",
  "Daewoo",
  "Другая",
];

const _carModels = {
  "Toyota": ["Camry", "Corolla", "Land Cruiser", "Prado", "RAV4", "Highlander", "Другая"],
  "Honda": ["Civic", "Accord", "CR-V", "Fit", "Другая"],
  "Hyundai": ["Sonata", "Elantra", "Tucson", "Santa Fe", "Accent", "Другая"],
  "Kia": ["K5", "Rio", "Sportage", "Sorento", "Cerato", "Другая"],
  "Nissan": ["Sunny", "Almera", "X-Trail", "Patrol", "Juke", "Другая"],
  "Chevrolet": ["Cobalt", "Lacetti", "Malibu", "Captiva", "Spark", "Другая"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLE", "Другая"],
  "BMW": ["3 Series", "5 Series", "X5", "X3", "Другая"],
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "Другая"],
  "Lexus": ["RX", "LX", "ES", "GX", "Другая"],
  "BYD": ["Song Plus", "Qin Plus", "Yuan Plus", "Han", "Другая"],
  "Lada": ["Granta", "Vesta", "Niva", "Largus", "Другая"],
  "Daewoo": ["Nexia", "Matiz", "Gentra", "Другая"],
};

const _tabletBrands = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Huawei",
  "Lenovo",
  "Honor",
  "Realme",
  "Другой",
];
const _tabletModels = {
  "Apple": ["iPad", "iPad Air", "iPad Pro", "iPad mini", "Другая"],
  "Samsung": ["Galaxy Tab A", "Galaxy Tab S", "Другая"],
  "Xiaomi": ["Redmi Pad", "Pad 6", "Другая"],
  "Huawei": ["MatePad", "Другая"],
  "Lenovo": ["Tab M", "Tab P", "Другая"],
};

const _laptopBrands = ["Apple", "Asus", "Lenovo", "HP", "Dell", "Acer", "MSI", "Huawei"];
const _laptopModels = {
  "Apple": ["MacBook Air M1", "MacBook Air M2", "MacBook Air M3", "MacBook Pro 14", "MacBook Pro 16"],
  "Asus": ["VivoBook", "ZenBook", "TUF Gaming", "ROG Strix"],
  "Lenovo": ["IdeaPad", "ThinkPad", "Legion", "Yoga"],
  "HP": ["Pavilion", "Victus", "Omen", "ProBook"],
  "Dell": ["Inspiron", "XPS", "Latitude", "Vostro"],
  "Acer": ["Aspire", "Swift", "Nitro", "Predator"],
  "MSI": ["Modern", "Katana", "Pulse"],
  "Huawei": ["MateBook D", "MateBook 14", "MateBook X Pro"],
};

const _applianceBrands = ["Artel", "Samsung", "LG", "Bosch", "Beko", "Hisense", "Xiaomi", "Shivaki"];
const _applianceModels = {
  "Artel": ["Холодильник", "Стиральная машина", "Телевизор", "Кондиционер", "Плита"],
  "Samsung": ["Холодильник", "Стиральная машина", "Телевизор", "Пылесос"],
  "LG": ["Холодильник", "Стиральная машина", "Телевизор", "Кондиционер"],
  "Bosch": ["Serie 4", "Serie 6", "Serie 8"],
  "Beko": ["Холодильник", "Стиральная машина", "Телевизор"],
  "Hisense": ["Smart TV", "Холодильник", "Кондиционер"],
  "Xiaomi": ["Mi TV", "Robot Vacuum", "Стиральная машина"],
  "Shivaki": ["Холодильник", "Стиральная машина", "Кондиционер"],
};

List<SpecFieldDef> specTemplateFor(String cat, [String subcategory = ""]) {
  final sub = subcategory.trim();
  return switch (cat) {
    "realestate" => _realEstate(sub),
    "transport" => _transport(sub),
    "furniture" => _furniture(sub),
    "phones" => _phones(sub),
    "electronics" => _electronics(sub),
    "computers" => _computers(sub),
    "services" => _services(sub),
    "repair" => const [
        SpecFieldDef(name: "Тип", type: "select", options: ["Окна", "Двери", "Кирпич", "Цемент", "Краска", "Инструмент", "Другое"]),
        SpecFieldDef(name: "Материал/Бренд"),
        SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "food" => _food(sub),
    "kids" => _kids(sub),
    "travel" => _travel(sub),
    "clothing" => _clothing(sub),
    "construction" => _construction(sub),
    "business" => _business(sub),
    _ => const [],
  };
}

SpecFieldDef _dealField(String sub) => SpecFieldDef(
      name: "Тип сделки",
      type: "select",
      options: realEstateDealsFor(sub),
    );

List<SpecFieldDef> _housingStayFields() => const [_rentTerm, _deposit, _pets, _guests];

List<SpecFieldDef> _realEstate(String sub) {
  final deal = _dealField(sub);
  const rooms = SpecFieldDef(name: "Комнат", type: "select", options: _rooms);
  const repair = SpecFieldDef(name: "Ремонт", type: "select", options: ["Без ремонта", "Косметический", "Евро", "Дизайнерский"]);
  const furniture = SpecFieldDef(name: "Мебель", type: "select", options: ["С мебелью", "Без мебели", "Частично"]);
  const districts = SpecFieldDef(name: "Район", type: "select", options: _dushanbeDistricts);

  return switch (sub) {
    "Комнаты" => [
        deal,
        const SpecFieldDef(name: "Площадь", placeholder: "м²"),
        const SpecFieldDef(name: "Этаж"),
        furniture,
        districts,
        ..._housingStayFields(),
      ],
    "Дома и коттеджи" => [
        deal,
        rooms,
        const SpecFieldDef(name: "Площадь дома", placeholder: "м²"),
        const SpecFieldDef(name: "Площадь участка", placeholder: "сот."),
        const SpecFieldDef(name: "Этажей", type: "select", options: ["1", "2", "3", "4+"]),
        repair,
        districts,
        ..._housingStayFields(),
      ],
    "Участки" => [
        deal,
        const SpecFieldDef(name: "Площадь участка", placeholder: "сот. или м²"),
        const SpecFieldDef(name: "Назначение", type: "select", options: ["ИЖС", "Сельхоз", "Коммерция", "Другое"]),
        const SpecFieldDef(name: "Коммуникации", type: "select", options: ["Все", "Частично", "Нет"]),
        districts,
        _rentTerm,
        _deposit,
      ],
    "Гаражи и парковки" => [
        deal,
        const SpecFieldDef(name: "Тип", type: "select", options: ["Гараж", "Машиноместо", "Бокс"]),
        const SpecFieldDef(name: "Площадь", placeholder: "м²"),
        const SpecFieldDef(name: "Охрана", type: "select", options: ["Есть", "Нет"]),
        _rentTerm,
        _deposit,
      ],
    "Коммерческая недвижимость" => [
        deal,
        const SpecFieldDef(name: "Тип объекта", type: "select", options: ["Офис", "Магазин", "Склад", "Общепит", "Другое"]),
        const SpecFieldDef(name: "Площадь", placeholder: "м²"),
        const SpecFieldDef(name: "Этаж"),
        repair,
        _rentTerm,
        _deposit,
      ],
    "Новостройки" => [
        deal,
        rooms,
        const SpecFieldDef(name: "Площадь общая", placeholder: "м²"),
        const SpecFieldDef(name: "Этаж"),
        const SpecFieldDef(name: "Этажей в доме"),
        districts,
        repair,
        SpecFieldDef(name: "Год постройки", type: "select", options: _buildYears),
        _rentTerm,
        _deposit,
      ],
    _ => [
        deal,
        rooms,
        const SpecFieldDef(name: "Площадь общая", placeholder: "м²"),
        const SpecFieldDef(name: "Этаж"),
        const SpecFieldDef(name: "Этажей в доме"),
        districts,
        repair,
        furniture,
        SpecFieldDef(name: "Год постройки", type: "select", options: _buildYears),
        const SpecFieldDef(name: "Состояние", type: "select", options: ["Новостройка", "Вторичка"]),
        ..._housingStayFields(),
      ],
  };
}

List<SpecFieldDef> _transport(String sub) {
  final car = [
    const SpecFieldDef(name: "Марка", type: "select", options: _carBrands),
    const SpecFieldDef(name: "Модель", type: "select", dependsOn: "Марка", optionsFrom: _carModels),
    SpecFieldDef(name: "Год", type: "select", options: _years),
    const SpecFieldDef(name: "Пробег", placeholder: "км"),
    const SpecFieldDef(name: "Кузов", type: "select", options: ["Седан", "Хэтчбек", "Универсал", "Кроссовер", "Внедорожник", "Минивэн", "Пикап", "Другое"]),
    const SpecFieldDef(name: "КПП", type: "select", options: ["Автомат", "Механика", "Робот", "Вариатор"]),
    const SpecFieldDef(name: "Топливо", type: "select", options: ["Бензин", "Дизель", "Газ", "Газ/Бензин", "Гибрид", "Электро"]),
    const SpecFieldDef(name: "Привод", type: "select", options: ["Передний", "Задний", "Полный"]),
    const SpecFieldDef(name: "Цвет", type: "select", options: _color),
    const SpecFieldDef(name: "Состояние", type: "select", options: _condition),
  ];
  final generic = [
    const SpecFieldDef(name: "Марка"),
    const SpecFieldDef(name: "Модель"),
    SpecFieldDef(name: "Год", type: "select", options: _years),
    const SpecFieldDef(name: "Состояние", type: "select", options: _condition),
  ];
  return switch (sub) {
    "Запчасти" => const [
        SpecFieldDef(name: "Тип запчасти", type: "select", options: ["Двигатель", "Кузов", "Подвеска", "Электрика", "Салон", "Оптика", "Другое"]),
        SpecFieldDef(name: "Марка авто", type: "select", options: _carBrands),
        SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "Шины и диски" => const [
        SpecFieldDef(name: "Сезон", type: "select", options: ["Летние", "Зимние", "Всесезонные"]),
        SpecFieldDef(name: "Диаметр", type: "select", options: ["R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20"]),
        SpecFieldDef(name: "Ширина", type: "select", options: ["175", "185", "195", "205", "215", "225", "235", "245"]),
        SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "Автохимия и автомасла" => const [
        SpecFieldDef(name: "Тип", type: "select", options: ["Масло", "Антифриз", "Омыватель", "Присадки", "Автокосметика", "Другое"]),
        SpecFieldDef(name: "Объём", type: "select", options: ["1 л", "4 л", "5 л", "20 л", "Другой"]),
      ],
    "Мототранспорт" => [
        const SpecFieldDef(name: "Тип", type: "select", options: ["Мотоцикл", "Скутер", "Мопед", "Квадроцикл", "Другое"]),
        SpecFieldDef(name: "Год", type: "select", options: _years),
        const SpecFieldDef(name: "Пробег", placeholder: "км"),
        const SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "Грузовики и автобусы" => [
        const SpecFieldDef(name: "Тип", type: "select", options: ["Грузовик", "Фургон", "Автобус", "Микроавтобус", "Другое"]),
        SpecFieldDef(name: "Год", type: "select", options: _years),
        const SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "Сельхозтехника" || "Спецтехника" || "Прицепы" => [
        const SpecFieldDef(name: "Тип"),
        SpecFieldDef(name: "Год", type: "select", options: _years),
        const SpecFieldDef(name: "Состояние", type: "select", options: _condition),
      ],
    "Легковые авто" || "" => car,
    _ => generic,
  };
}

List<SpecFieldDef> _phones(String sub) {
  const condition = SpecFieldDef(name: "Состояние", type: "select", options: _condition);
  const warranty = SpecFieldDef(name: "Гарантия", type: "select", options: _warranty);
  if (sub == "Мобильные аксессуары") {
    return const [
      SpecFieldDef(
        name: "Тип аксессуара",
        type: "select",
        options: [
          "Чехлы",
          "Защитные стёкла и плёнки",
          "Зарядные устройства",
          "Повербанки",
          "Держатели и подставки",
          "Аксессуары для съёмки",
          "Игровые аксессуары",
          "Карты памяти и накопители",
          "Прочие аксессуары",
        ],
      ),
      condition,
      warranty,
    ];
  }
  if (sub == "Планшеты") {
    return const [
      SpecFieldDef(name: "Производитель", type: "select", options: _tabletBrands),
      SpecFieldDef(name: "Модель", type: "select", dependsOn: "Производитель", optionsFrom: _tabletModels),
      SpecFieldDef(name: "Память", type: "select", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"]),
      condition,
      warranty,
    ];
  }
  return const [
    SpecFieldDef(name: "Производитель", type: "select", options: _phoneBrands),
    SpecFieldDef(name: "Модель", type: "select", dependsOn: "Производитель", optionsFrom: _phoneModels),
    SpecFieldDef(name: "Память", type: "select", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"]),
    condition,
    warranty,
  ];
}

List<SpecFieldDef> _electronics(String sub) {
  const brand = SpecFieldDef(name: "Бренд", type: "select", options: _applianceBrands);
  const model = SpecFieldDef(name: "Модель", type: "select", dependsOn: "Бренд", optionsFrom: _applianceModels);
  const condition = SpecFieldDef(name: "Состояние", type: "select", options: _condition);
  const warranty = SpecFieldDef(name: "Гарантия", type: "select", options: _warranty);
  if (sub == "Видеонаблюдение и камеры") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["Камера", "Готовый комплект", "Регистратор", "Другое"]),
      condition,
      warranty,
    ];
  }
  if (sub == "Климатическая техника") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["Кондиционер", "Очиститель воздуха", "Увлажнитель", "Другое"]),
      brand,
      condition,
      warranty,
    ];
  }
  if (sub == "Обогреватели") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["Масляный", "Конвектор", "Инфракрасный", "Тепловентилятор", "Другое"]),
      brand,
      condition,
      warranty,
    ];
  }
  return const [
    SpecFieldDef(name: "Тип", type: "select", options: ["Холодильник", "Стиральная машина", "Плита", "Телевизор", "Пылесос", "Кондиционер", "Микроволновка", "Другое"]),
    brand,
    model,
    condition,
    warranty,
  ];
}

List<SpecFieldDef> _computers(String sub) {
  const condition = SpecFieldDef(name: "Состояние", type: "select", options: _condition);
  const ram = SpecFieldDef(name: "ОЗУ", type: "select", options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"]);
  const storage = SpecFieldDef(name: "Накопитель", type: "select", options: ["128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "1 TB HDD"]);
  if (sub == "Принтеры и сканеры") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["Принтер", "Сканер", "МФУ", "Другое"]),
      condition,
    ];
  }
  if (sub == "Приставки") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["PlayStation", "Xbox", "Nintendo", "Другое"]),
      condition,
    ];
  }
  if (sub == "ПК") {
    return const [
      SpecFieldDef(name: "Процессор"),
      ram,
      storage,
      condition,
    ];
  }
  if (sub == "Ноутбуки") {
    return const [
      SpecFieldDef(name: "Бренд", type: "select", options: _laptopBrands),
      SpecFieldDef(name: "Модель", type: "select", dependsOn: "Бренд", optionsFrom: _laptopModels),
      SpecFieldDef(name: "Процессор"),
      ram,
      storage,
      condition,
    ];
  }
  return const [
    SpecFieldDef(name: "Тип", type: "select", options: ["Ноутбук", "ПК", "Монитор", "Принтер", "Игровая приставка", "Другое"]),
    SpecFieldDef(name: "Бренд", type: "select", options: _laptopBrands),
    SpecFieldDef(name: "Модель", type: "select", dependsOn: "Бренд", optionsFrom: _laptopModels),
    SpecFieldDef(
      name: "Процессор",
      whenName: "Тип",
      whenValues: ["Ноутбук", "ПК"],
    ),
    SpecFieldDef(
      name: "ОЗУ",
      type: "select",
      options: ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
      whenName: "Тип",
      whenValues: ["Ноутбук", "ПК"],
    ),
    SpecFieldDef(
      name: "Накопитель",
      type: "select",
      options: ["128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "1 TB HDD"],
      whenName: "Тип",
      whenValues: ["Ноутбук", "ПК"],
    ),
    condition,
  ];
}

List<SpecFieldDef> _furniture(String sub) {
  const material = SpecFieldDef(
    name: "Материал",
    type: "select",
    options: ["Дерево", "МДФ", "ДСП", "Металл", "Пластик", "Стекло", "Комбинированный"],
  );
  const condition = SpecFieldDef(name: "Состояние", type: "select", options: _condition);
  const color = SpecFieldDef(name: "Цвет", type: "select", options: _color);
  final types = switch (sub) {
    "Мебель для спальни" => ["Кровать", "Шкаф", "Комод", "Тумба", "Другое"],
    "Офисная мебель" => ["Стол", "Стул", "Кресло", "Шкаф", "Другое"],
    "Мебель для гостиной" => ["Диван", "Кресло", "Стол", "Шкаф", "Другое"],
    "Мебель для прихожей" => ["Шкаф", "Тумба", "Вешалка", "Другое"],
    "Мебель на заказ" => ["Кухня", "Шкаф-купе", "Гардеробная", "Другое"],
    _ => ["Диван", "Кровать", "Шкаф", "Стол", "Стул", "Комод", "Кухня", "Другое"],
  };
  return [
    SpecFieldDef(name: "Тип", type: "select", options: types),
    material,
    if (sub != "Мебель на заказ") condition,
    color,
  ];
}

List<SpecFieldDef> _services(String sub) {
  const base = [
    SpecFieldDef(name: "Формат", type: "select", options: _serviceFormat),
    SpecFieldDef(name: "Опыт", type: "select", options: _serviceExperience),
    SpecFieldDef(name: "Срок выполнения"),
  ];
  if (sub == "Ремонт авто") {
    return const [
      SpecFieldDef(name: "Тип услуги", type: "select", options: ["Ремонт", "Диагностика", "Шиномонтаж", "Мойка", "Тюнинг", "Эвакуатор", "Другое"]),
      SpecFieldDef(name: "Формат", type: "select", options: _serviceFormat),
      SpecFieldDef(name: "Опыт", type: "select", options: _serviceExperience),
    ];
  }
  if (sub == "Ремонт телефонов и планшетов") {
    return const [
      SpecFieldDef(name: "Тип услуги", type: "select", options: ["Замена экрана", "Замена батареи", "Ремонт разъёма", "Прошивка", "Чистка", "Другое"]),
      SpecFieldDef(name: "Формат", type: "select", options: _serviceFormat),
      SpecFieldDef(name: "Опыт", type: "select", options: _serviceExperience),
    ];
  }
  if (sub == "Ремонт компьютеров и бытовой техники") {
    return const [
      SpecFieldDef(name: "Тип техники", type: "select", options: ["Компьютеры и ноутбуки", "Бытовая техника", "Принтеры и сканеры", "Игровые приставки", "Другое"]),
      SpecFieldDef(name: "Формат", type: "select", options: _serviceFormat),
      SpecFieldDef(name: "Опыт", type: "select", options: _serviceExperience),
    ];
  }
  return base;
}

List<SpecFieldDef> _food(String sub) {
  final group = _group(sub);
  if (group == "Услуги повара") {
    return const [
      SpecFieldDef(name: "Формат", type: "select", options: ["Домашний повар", "Кейтеринг", "На свадьбу и той", "Разово"]),
      SpecFieldDef(name: "Выезд", type: "select", options: ["По городу", "С выездом", "Только на месте"]),
    ];
  }
  if (group == "Особое питание") {
    return const [
      SpecFieldDef(name: "Формат", type: "select", options: ["Доставка", "Самовывоз", "На заказ", "Доставка и самовывоз"]),
      SpecFieldDef(name: "Тип питания", type: "select", options: ["Халяль", "Диетическое", "Без сахара", "Другое"]),
    ];
  }
  return const [
    SpecFieldDef(name: "Формат", type: "select", options: ["Доставка", "Самовывоз", "На заказ", "Доставка и самовывоз"]),
    SpecFieldDef(name: "Готовность", type: "select", options: ["Свежее", "Заморозка", "Полуфабрикат"]),
  ];
}

List<SpecFieldDef> _kids(String sub) {
  final group = _group(sub);
  final item = _item(sub);
  if (group == "Услуги") {
    return const [
      SpecFieldDef(name: "Формат", type: "select", options: ["Няня", "Репетитор", "Кружок / секция", "Разово"]),
      SpecFieldDef(name: "Возраст", type: "select", options: _kidsAges),
    ];
  }
  if (group == "Коляски и автокресла") {
    return const [
      SpecFieldDef(name: "Тип", type: "select", options: ["Коляска", "Автокресло", "Люлька", "Трансформер", "Другое"]),
      SpecFieldDef(name: "Возраст", type: "select", options: _kidsAges),
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
    ];
  }
  if (item == "Обувь") {
    return const [
      SpecFieldDef(name: "Возраст", type: "select", options: _kidsAges),
      SpecFieldDef(name: "Размер", type: "select", options: ["19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "Другой"]),
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
    ];
  }
  if (["Для мальчиков", "Для девочек", "Для новорождённых"].contains(group) &&
      (item.isEmpty || item == "Одежда" || item == "Школьная форма")) {
    return const [
      SpecFieldDef(name: "Возраст", type: "select", options: _kidsAges),
      SpecFieldDef(name: "Размер", type: "select", options: ["56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "Другой"]),
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
    ];
  }
  return const [
    SpecFieldDef(name: "Возраст", type: "select", options: _kidsAges),
    SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
  ];
}

List<SpecFieldDef> _travel(String sub) {
  final group = _group(sub);
  const duration = SpecFieldDef(name: "Длительность", type: "select", options: ["1 день", "2–3 дня", "4–7 дней", "Больше недели"]);
  return switch (group) {
    "Туры по Таджикистану" => const [
        SpecFieldDef(name: "Направление", type: "select", options: ["Фанские горы", "Памир и Хорог", "Искандеркуль", "Семь озёр", "Худжанд и Согд", "Другое по РТ"]),
        duration,
        SpecFieldDef(name: "Формат", type: "select", options: ["Групповой", "Индивидуальный", "Семейный"]),
      ],
    "Туры за границу" => const [
        SpecFieldDef(name: "Направление", type: "select", options: ["Узбекистан", "Турция", "ОАЭ", "Россия", "Другое"]),
        duration,
        SpecFieldDef(name: "Формат", type: "select", options: ["Групповой", "Индивидуальный", "Семейный"]),
      ],
    "Экскурсии и гиды" => const [
        SpecFieldDef(name: "Формат", type: "select", options: ["Гид", "Групповая экскурсия", "Индивидуальная", "Горный маршрут"]),
        duration,
      ],
    "Базы отдыха" => const [
        SpecFieldDef(name: "Тип размещения", type: "select", options: ["База отдыха", "Горный домик", "Кемпинг / глэмпинг", "Другое"]),
        SpecFieldDef(name: "Питание", type: "select", options: ["С питанием", "Без питания", "По запросу"]),
      ],
    "Транспорт и билеты" => const [
        SpecFieldDef(name: "Тип услуги", type: "select", options: ["Аренда авто", "Авто с водителем", "Трансфер", "Авиа / ж/д билеты", "Другое"]),
      ],
    "Снаряжение" => const [
        SpecFieldDef(name: "Тип", type: "select", options: ["Палатка / спальник", "Рюкзак", "Альпинизм", "Другое"]),
      ],
    _ => const [
        SpecFieldDef(name: "Направление", type: "select", options: ["Фанские горы", "Памир и Хорог", "Турция", "Узбекистан", "Другое"]),
        duration,
        SpecFieldDef(name: "Формат", type: "select", options: ["Групповой", "Индивидуальный", "Семейный"]),
      ],
  };
}

List<SpecFieldDef> _clothing(String sub) {
  final group = _group(sub);
  const seasons = SpecFieldDef(name: "Сезон", type: "select", options: ["Лето", "Зима", "Демисезон", "Всесезон"]);
  const colors = SpecFieldDef(name: "Цвет", type: "select", options: ["Чёрный", "Белый", "Серый", "Бежевый", "Синий", "Красный", "Другой"]);
  if (group == "Обувь") {
    return const [
      SpecFieldDef(name: "Размер", type: "select", options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "Другой"]),
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
      seasons,
      colors,
    ];
  }
  if (group == "Ювелирные украшения") {
    return const [
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
      SpecFieldDef(name: "Материал", type: "select", options: ["Золото", "Серебро", "Бижутерия", "Другое"]),
    ];
  }
  if (group == "Ткани") {
    return const [
      SpecFieldDef(name: "Тип ткани", type: "select", options: ["Атлас", "Адрас", "Хлопок", "Шёлк", "Другое"]),
      SpecFieldDef(name: "Формат", type: "select", options: ["Метраж", "Отрез", "Готовое изделие"]),
    ];
  }
  if (group == "Аксессуары" || group == "Сумки и чемоданы") {
    return const [
      SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
      colors,
    ];
  }
  return const [
    SpecFieldDef(name: "Размер", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL", "42", "44", "46", "48", "50", "Универсальный"]),
    SpecFieldDef(name: "Состояние", type: "select", options: _clothingCondition),
    seasons,
    colors,
  ];
}

List<SpecFieldDef> _construction(String sub) {
  final group = _group(sub);
  if (group == "Аренда техники") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Аренда"]),
      SpecFieldDef(name: "Единица", type: "select", options: ["За час", "За день", "За смену", "За месяц"]),
    ];
  }
  if (group == "Услуги мастеров") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Услуга"]),
      SpecFieldDef(name: "Формат", type: "select", options: ["Разовая", "Под ключ", "По договору"]),
    ];
  }
  if (group == "Проектирование") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Услуга"]),
      SpecFieldDef(name: "Формат", type: "select", options: ["Архитектура", "Дизайн интерьера", "Смета", "Другое"]),
    ];
  }
  if (group == "Инструменты") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа"]),
      SpecFieldDef(name: "Состояние", type: "select", options: _condition),
    ];
  }
  return const [
    SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа"]),
    SpecFieldDef(name: "Состояние", type: "select", options: _condition),
  ];
}

List<SpecFieldDef> _business(String sub) {
  final group = _group(sub);
  if (group == "Бизнес на продажу") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа"]),
      SpecFieldDef(name: "Формат", type: "select", options: ["Действующий", "Под ключ", "Доля", "Другое"]),
    ];
  }
  if (group == "Готовый бизнес в аренду") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Аренда"]),
      SpecFieldDef(name: "Единица", type: "select", options: ["За день", "За месяц", "За год"]),
    ];
  }
  if (group == "Оборудование") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа", "Аренда"]),
      SpecFieldDef(name: "Состояние", type: "select", options: _condition),
    ];
  }
  if (group == "Сырьё и материалы") {
    return const [
      SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа"]),
    ];
  }
  return const [
    SpecFieldDef(name: "Тип сделки", type: "select", options: ["Продажа", "Аренда"]),
  ];
}

List<SpecFieldDef> visibleSpecTemplate(
  String cat,
  String subcategory, [
  Map<String, String> values = const {},
  String city = "",
]) {
  return [
    for (final def in specTemplateFor(cat, subcategory))
      if (def.visibleFor(values))
        if (def.name == "Район")
          SpecFieldDef(
            name: def.name,
            type: "select",
            options: districtsForCity(city),
            whenName: def.whenName,
            whenValues: def.whenValues,
          )
        else
          def,
  ];
}

Map<String, String> pruneListingSpecs(
  String cat,
  String subcategory,
  Map<String, String> specs, {
  String city = "",
}) {
  final next = Map<String, String>.from(specs);
  if (cat == "realestate") {
    final deal = next["Тип сделки"] ?? "";
    if (deal.isNotEmpty && !realEstateDealsFor(subcategory).contains(deal)) {
      next.remove("Тип сделки");
    }
  }
  final defs = visibleSpecTemplate(cat, subcategory, next, city);
  final allowed = {for (final def in defs) def.name: def};
  next.removeWhere((name, _) => !allowed.containsKey(name));
  for (final entry in [...next.entries]) {
    final def = allowed[entry.key];
    if (def == null) continue;
    if (def.options.isNotEmpty && !def.options.contains(entry.value)) {
      next.remove(entry.key);
    }
  }
  return next;
}

List<SpecDraft> draftsFromTemplate(
  String cat,
  String subcategory, [
  Iterable<({String name, String value})> existing = const [],
  String city = "",
]) {
  final values = {for (final item in existing) item.name: item.value};
  final pruned = pruneListingSpecs(cat, subcategory, values, city: city);
  return [
    for (final def in visibleSpecTemplate(cat, subcategory, pruned, city))
      SpecDraft(def: def, value: pruned[def.name] ?? ""),
  ];
}

List<Map<String, String>> compactSpecs(List<SpecDraft> specs) {
  return [
    for (final spec in specs)
      if (spec.name.trim().isNotEmpty && spec.value.trim().isNotEmpty)
        {"name": spec.name.trim(), "value": spec.value.trim()},
  ];
}

List<String> specOptionsFor(SpecDraft spec, List<SpecDraft> all) {
  if (spec.def.options.isNotEmpty) return spec.def.options;
  final from = spec.def.optionsFrom;
  if (from == null || spec.def.dependsOn.isEmpty) return const [];
  SpecDraft? parent;
  for (final row in all) {
    if (row.name == spec.def.dependsOn) parent = row;
  }
  return from[parent?.value ?? ""] ?? const [];
}
