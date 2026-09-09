import React from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  MousePointerClick,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "../../lib/api";
import { getId } from "../../lib/adminUtils";
import {
  AD_FORMATS,
  AD_PLACEMENTS,
  FORMAT_LABELS,
  PLACEMENT_LABELS,
} from "../../lib/adPlacements";
import { formatAdCtr } from "../../lib/adFeed";
import { HOME_CATEGORIES } from "../../data/categories";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea,
  useConfirm,
  useToast,
} from "../../ui";
import { useI18n } from "../../i18n";
import {
  DataTable,
  SectionHeader,
  StatTile,
  TableRow,
  TableSkeleton,
  Td,
  Th,
} from "./AdminUI";

const FORM_ID = "admin-ad-form";

const EMPTY_FORM = {
  title: "",
  advertiser: "",
  placement: "listing_top",
  format: "banner",
  imageUrl: "",
  linkUrl: "",
  headline: "",
  description: "",
  htmlCode: "",
  cat: "",
  priority: 0,
  active: true,
  startsAt: "",
  endsAt: "",
};

const PLACEMENT_OPTIONS = AD_PLACEMENTS.map((item) => ({
  value: item.id,
  label: item.label,
}));

const FORMAT_OPTIONS = AD_FORMATS.map((item) => ({
  value: item.id,
  label: item.label,
}));

const CATEGORY_OPTIONS = [
  { value: "", label: "Все категории" },
  ...HOME_CATEGORIES.map((item) => ({ value: item.slug, label: item.title })),
];

function toLocalInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export default function AdminAdsSection({ token }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [items, setItems] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [titleError, setTitleError] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState("");
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    try {
      setError("");

      const [list, summary] = await Promise.all([
        api.adminAds(token),
        api.adminAdStats(token),
      ]);

      setItems(Array.isArray(list) ? list : []);
      setStats(summary || null);
    } catch (e) {
      setError(e.message || "Не удалось загрузить рекламу");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const openCreate = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setTitleError("");
    setError("");
    setEditorOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(getId(item));
    setForm({
      title: item.title || "",
      advertiser: item.advertiser || "",
      placement: item.placement || "listing_top",
      format: item.format || "banner",
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      headline: item.headline || "",
      description: item.description || "",
      htmlCode: item.htmlCode || "",
      cat: item.cat || "",
      priority: Number(item.priority || 0),
      active: item.active !== false,
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
    });
    setTitleError("");
    setError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId("");
    setForm(EMPTY_FORM);
    setTitleError("");
  };

  const uploadBanner = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("images", file);

      const result = await api.uploadImages(token, formData);
      const url = Array.isArray(result?.urls) ? result.urls[0] : "";

      if (!url) {
        throw new Error("Не удалось загрузить изображение");
      }

      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e) {
      setError(e.message || "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title.trim(),
      advertiser: form.advertiser.trim(),
      placement: form.placement,
      format: form.format,
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim(),
      headline: form.headline.trim(),
      description: form.description.trim(),
      htmlCode: form.htmlCode.trim(),
      cat: form.cat,
      priority: Number(form.priority || 0),
      active: form.active,
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
    };

    if (!payload.title) {
      setTitleError("Укажите название кампании");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setTitleError("");

      if (editingId) {
        await api.adminUpdateAd(token, editingId, payload);
      } else {
        await api.adminCreateAd(token, payload);
      }

      closeEditor();
      await load();
      showToast(t("admin.toastAdSaved"), "success");
    } catch (e) {
      setError(e.message || "Не удалось сохранить рекламу");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    const id = getId(item);

    const ok = await confirm({
      title: t("admin.deleteAdTitle"),
      message: t("admin.deleteAdMessage", { title: item.title || "—" }),
      confirmLabel: t("admin.deleteConfirm"),
      tone: "danger",
    });

    if (!ok) return;

    try {
      setError("");
      await api.adminDeleteAd(token, id);
      setItems((prev) => prev.filter((row) => String(getId(row)) !== String(id)));
      await load();
      showToast(t("admin.toastAdDeleted"), "success");
    } catch (e) {
      setError(e.message || "Не удалось удалить рекламу");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <SectionHeader
          eyebrow="Рекламные места"
          icon={Megaphone}
          title="Реклама"
          description="Управление баннерами, native-блоками и HTML-кодом рекламных сетей."
          action={
            <Button variant="primary" icon={Plus} onClick={openCreate}>
              Новая кампания
            </Button>
          }
        />

        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Кампаний" value={stats.total || 0} />
            <StatTile
              label="Активных"
              value={stats.active || 0}
              tone="success"
            />
            <StatTile
              icon={BarChart3}
              label="Показы"
              value={Number(stats.impressions || 0).toLocaleString("ru-RU")}
            />
            <StatTile
              icon={MousePointerClick}
              label="CTR"
              value={formatAdCtr(stats.clicks, stats.impressions)}
              hint={`${Number(stats.clicks || 0).toLocaleString("ru-RU")} кликов`}
            />
          </div>
        )}

        {error && !editorOpen && <Alert tone="danger">{error}</Alert>}

        {loading ? (
          <TableSkeleton label={t("admin.tableAds")} rows={5} columns={5} />
        ) : items.length === 0 ? (
          <EmptyState
            bare
            icon={Megaphone}
            title="Рекламных кампаний пока нет"
            description={t("admin.adsEmptyDescription")}
            actionLabel="Новая кампания"
            onAction={openCreate}
          />
        ) : (
          <DataTable label={t("admin.tableAds")} minWidth="56rem">
            <thead>
              <tr>
                <Th>Кампания</Th>
                <Th>Зона</Th>
                <Th>Формат</Th>
                <Th>Статистика</Th>
                <Th>Статус</Th>
                <Th align="right">Действия</Th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <TableRow key={getId(item)}>
                  <Td>
                    <div className="font-semibold text-ink-900">{item.title}</div>
                    <div className="text-xs text-ink-400">
                      {item.advertiser || "Без рекламодателя"}
                      {item.cat ? ` · ${item.cat}` : " · все категории"}
                    </div>
                  </Td>

                  <Td className="text-ink-600">
                    {PLACEMENT_LABELS[item.placement] || item.placement}
                  </Td>

                  <Td className="text-ink-600">
                    {FORMAT_LABELS[item.format] || item.format}
                  </Td>

                  <Td className="text-ink-600">
                    <div>
                      {Number(item.impressions || 0).toLocaleString("ru-RU")}{" "}
                      показов
                    </div>
                    <div className="text-xs text-ink-400">
                      {Number(item.clicks || 0).toLocaleString("ru-RU")} кликов ·{" "}
                      {formatAdCtr(item.clicks, item.impressions)}
                    </div>
                  </Td>

                  <Td>
                    <Badge tone={item.active ? "success" : "neutral"}>
                      {item.active ? "Активна" : "Выключена"}
                    </Badge>
                  </Td>

                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <IconButton
                        size="sm"
                        icon={Pencil}
                        label={t("admin.editAd", { title: item.title || "—" })}
                        onClick={() => openEdit(item)}
                      />
                      <IconButton
                        size="sm"
                        variant="danger"
                        icon={Trash2}
                        label={t("admin.deleteAd", { title: item.title || "—" })}
                        onClick={() => removeItem(item)}
                      />
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        size="lg"
        title={editingId ? "Редактировать кампанию" : "Новая рекламная кампания"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={closeEditor}>Отмена</Button>
            <Button
              type="submit"
              form={FORM_ID}
              variant="primary"
              loading={saving}
            >
              {editingId ? "Сохранить" : "Создать"}
            </Button>
          </div>
        }
      >
        <form id={FORM_ID} onSubmit={submit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Название кампании" required error={titleError}>
              {(props) => (
                <Input
                  {...props}
                  value={form.title}
                  onChange={(e) => {
                    setTitleError("");
                    setForm((prev) => ({ ...prev, title: e.target.value }));
                  }}
                  invalid={Boolean(titleError)}
                />
              )}
            </Field>

            <Field label="Рекламодатель">
              {(props) => (
                <Input
                  {...props}
                  value={form.advertiser}
                  onChange={setField("advertiser")}
                />
              )}
            </Field>

            <Field label="Зона показа">
              {(props) => (
                <Select
                  {...props}
                  value={form.placement}
                  onChange={setField("placement")}
                  options={PLACEMENT_OPTIONS}
                />
              )}
            </Field>

            <Field label="Формат">
              {(props) => (
                <Select
                  {...props}
                  value={form.format}
                  onChange={setField("format")}
                  options={FORMAT_OPTIONS}
                />
              )}
            </Field>

            <Field label="Категория" hint={t("admin.optional")}>
              {(props) => (
                <Select
                  {...props}
                  value={form.cat}
                  onChange={setField("cat")}
                  options={CATEGORY_OPTIONS}
                />
              )}
            </Field>

            <Field label="Приоритет" hint={t("admin.priorityHint")}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: Number(e.target.value || 0),
                    }))
                  }
                />
              )}
            </Field>

            <Field label="Старт">
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={setField("startsAt")}
                />
              )}
            </Field>

            <Field label="Окончание">
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={setField("endsAt")}
                />
              )}
            </Field>
          </div>

          {form.format !== "html" ? (
            <div className="space-y-4">
              <Field label="Заголовок для пользователя">
                {(props) => (
                  <Input
                    {...props}
                    value={form.headline}
                    onChange={setField("headline")}
                  />
                )}
              </Field>

              <Field label="Описание">
                {(props) => (
                  <Textarea
                    {...props}
                    value={form.description}
                    onChange={setField("description")}
                    className="min-h-[5.5rem]"
                  />
                )}
              </Field>

              <Field label="Ссылка">
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    value={form.linkUrl}
                    onChange={setField("linkUrl")}
                    placeholder="https://"
                  />
                )}
              </Field>

              <Field label="URL изображения" hint={t("admin.bannerHint")}>
                {(props) => (
                  <Input
                    {...props}
                    value={form.imageUrl}
                    onChange={setField("imageUrl")}
                    placeholder="https://..."
                  />
                )}
              </Field>

              <div>
                <label className="btn inline-flex cursor-pointer focus-within:ring-2 focus-within:ring-sun/40">
                  <ImageIcon size={16} aria-hidden="true" />
                  {uploading ? "Загрузка…" : "Загрузить баннер"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={uploadBanner}
                    disabled={uploading}
                  />
                </label>

                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="mt-3 max-h-40 rounded-2xl border border-ink-200 object-cover"
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <Field label="HTML / код рекламной сети">
              {(props) => (
                <Textarea
                  {...props}
                  value={form.htmlCode}
                  onChange={setField("htmlCode")}
                  placeholder="<script>...</script> или iframe"
                  className="min-h-[10rem] font-mono text-xs"
                />
              )}
            </Field>
          )}

          <Checkbox
            boxed
            label="Кампания активна"
            description={t("admin.adActiveHint")}
            checked={form.active}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, active: e.target.checked }))
            }
          />
        </form>
      </Modal>
    </div>
  );
}
