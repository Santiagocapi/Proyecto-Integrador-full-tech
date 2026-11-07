<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const { success, error: toastError } = useToast()

// La misma vista sirve para /admin/productos/nuevo y /admin/productos/:id
const productId = computed(() => route.params.id)
const productSlug = computed(() => route.params.slug)
const isEdit = computed(() => !!productSlug.value)

const CONNECTION_SUGGESTIONS = ['USB', 'XLR', 'Lightning', 'USB-C', 'Inalámbrico']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const categories = ref([])
const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')
const submitting = ref(false)
const uploading = ref(false)
const slugTouched = ref(false)
const errors = ref({})

const form = reactive(emptyForm())

function emptyForm() {
  return {
    name: '',
    slug: '',
    category_id: '',
    description: '',
    price: '',
    offer_price: '',
    connection_type: '',
    compatibility: '', // texto separado por comas
    specs: [], // [{ key, value }]
    images: [], // URLs públicas
    is_bundle: false,
    active: true,
    variants: [{ id: null, name: 'Único', sku: '', stock: 0 }],
  }
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// En un producto nuevo el slug se sugiere a partir del nombre hasta que se edita a mano
watch(
  () => form.name,
  (name) => {
    if (!isEdit.value && !slugTouched.value) form.slug = slugify(name)
  },
)

function fillForm(p) {
  form.name = p.name ?? ''
  form.slug = p.slug ?? ''
  form.category_id = p.category_id ?? p.category?.id ?? ''
  form.description = p.description ?? ''
  form.price = p.price ?? ''
  form.offer_price = p.offer_price ?? ''
  form.connection_type = p.connection_type ?? ''
  form.compatibility = (p.compatibility ?? []).join(', ')
  form.specs = Object.entries(p.specs ?? {}).map(([key, value]) => ({ key, value: String(value) }))
  form.images = [...(p.images ?? [])]
  form.is_bundle = !!p.is_bundle
  form.active = p.active ?? true
  form.variants = (p.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    stock: v.stock,
  }))
  if (!form.variants.length) form.variants.push({ id: null, name: 'Único', sku: '', stock: 0 })
}

async function load() {
  loading.value = true
  notFound.value = false
  loadError.value = ''
  try {
    const catRes = await api.get('/categories')
    categories.value = Array.isArray(catRes) ? catRes : (catRes.items ?? [])

    if (isEdit.value) {
      const product = await api.get(`/products/${productSlug.value}`, { auth: true })
      fillForm(product)
      slugTouched.value = true
    } else {
      Object.assign(form, emptyForm())
      slugTouched.value = false
    }
  } catch (e) {
    if (e.status === 404) notFound.value = true
    else loadError.value = e.message || 'No se pudo cargar el formulario.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(productId, load)

// ---- Variantes y ficha técnica (listas dinámicas) ----
function addVariant() {
  form.variants.push({ id: null, name: '', sku: '', stock: 0 })
}
function removeVariant(index) {
  if (form.variants.length > 1) form.variants.splice(index, 1)
}
function addSpec() {
  form.specs.push({ key: '', value: '' })
}
function removeSpec(index) {
  form.specs.splice(index, 1)
}

// ---- Imágenes ----
async function onFilesSelected(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toastError(`«${file.name}» no es JPG, PNG ni WebP.`)
      continue
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toastError(`«${file.name}» pesa más de 2 MB.`)
      continue
    }
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await api.post('/admin/uploads', body, { auth: true })
      form.images.push(res.url)
    } catch (e) {
      toastError(e.message || `No se pudo subir «${file.name}».`)
    }
  }
  uploading.value = false
}
function removeImage(index) {
  form.images.splice(index, 1)
}

// ---- Validación ----
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validate() {
  const e = {}
  if (form.name.trim().length < 3) e.name = 'El nombre tiene que tener al menos 3 caracteres.'
  if (!form.slug) e.slug = 'El slug es obligatorio.'
  else if (!SLUG_REGEX.test(form.slug)) e.slug = 'Usá minúsculas, números y guiones, sin espacios.'
  if (!form.category_id) e.category_id = 'Elegí una categoría.'
  if (!form.description.trim()) e.description = 'Escribí una descripción.'

  const price = Number(form.price)
  if (form.price === '' || Number.isNaN(price) || price <= 0) e.price = 'Ingresá un precio mayor a 0.'

  if (form.offer_price !== '' && form.offer_price !== null) {
    const offer = Number(form.offer_price)
    if (Number.isNaN(offer) || offer < 0) e.offer_price = 'Ingresá un precio de oferta válido.'
    else if (!e.price && offer >= price) e.offer_price = 'La oferta tiene que ser menor al precio normal.'
  }

  const seenSkus = new Set()
  const variantErrors = form.variants.map((v) => {
    const ve = {}
    if (!v.name.trim()) ve.name = 'Poné un nombre.'
    if (!v.sku.trim()) ve.sku = 'El SKU es obligatorio.'
    else if (seenSkus.has(v.sku.trim())) ve.sku = 'El SKU está repetido.'
    else seenSkus.add(v.sku.trim())
    const stock = Number(v.stock)
    if (v.stock === '' || !Number.isInteger(stock) || stock < 0) ve.stock = 'Stock entero, 0 o mayor.'
    return ve
  })
  if (variantErrors.some((ve) => Object.keys(ve).length)) e.variants = variantErrors

  const hasHalfSpec = form.specs.some((s) => !!s.key.trim() !== !!s.value.trim())
  if (hasHalfSpec) e.specs = 'Completá nombre y valor en cada dato de la ficha técnica.'

  errors.value = e
  return Object.keys(e).length === 0
}

function buildPayload() {
  return {
    name: form.name.trim(),
    slug: form.slug,
    category_id: Number(form.category_id),
    description: form.description.trim(),
    price: Number(form.price),
    offer_price: form.offer_price === '' || form.offer_price === null ? null : Number(form.offer_price),
    connection_type: form.connection_type.trim() || null,
    compatibility: form.compatibility
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    specs: Object.fromEntries(
      form.specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => [s.key.trim(), s.value.trim()]),
    ),
    images: form.images,
    is_bundle: form.is_bundle,
    active: form.active,
    variants: form.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      name: v.name.trim(),
      sku: v.sku.trim(),
      stock: Number(v.stock),
    })),
  }
}

async function submit() {
  if (!validate()) {
    toastError('Revisá los campos marcados.')
    return
  }
  submitting.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await api.put(`/admin/products/${productId.value}`, payload, { auth: true })
      success('Cambios guardados.')
    } else {
      await api.post('/admin/products', payload, { auth: true })
      success('Producto creado.')
    }
    router.push('/admin/productos')
  } catch (e) {
    toastError(e.message || 'No se pudo guardar el producto.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="adm-page">
    <header class="adm-head">
      <h1 class="adm-title">{{ isEdit ? 'Editar producto' : 'Crear producto' }}</h1>
      <RouterLink class="adm-btn" to="/admin/productos">Volver a productos</RouterLink>
    </header>

    <p v-if="loading" class="adm-state" role="status">Cargando…</p>

    <div v-else-if="notFound" class="adm-state" role="alert">
      <p>No encontramos este producto.</p>
      <RouterLink class="adm-btn" to="/admin/productos">Volver a productos</RouterLink>
    </div>

    <div v-else-if="loadError" class="adm-state adm-state--error" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="adm-btn" @click="load">Reintentar</button>
    </div>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <fieldset class="adm-card grid">
        <legend class="legend">Datos generales</legend>

        <label class="adm-label">
          Nombre
          <input v-model="form.name" class="adm-input" type="text" :aria-invalid="!!errors.name" />
          <p v-if="errors.name" class="adm-error">{{ errors.name }}</p>
        </label>

        <label class="adm-label">
          Slug (parte de la URL)
          <input
            v-model="form.slug"
            class="adm-input"
            type="text"
            :aria-invalid="!!errors.slug"
            @input="slugTouched = true"
          />
          <p v-if="errors.slug" class="adm-error">{{ errors.slug }}</p>
        </label>

        <label class="adm-label">
          Categoría
          <select v-model="form.category_id" class="adm-input" :aria-invalid="!!errors.category_id">
            <option value="" disabled>Elegí una categoría</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <p v-if="errors.category_id" class="adm-error">{{ errors.category_id }}</p>
        </label>

        <label class="adm-label">
          Tipo de conexión
          <input v-model="form.connection_type" class="adm-input" type="text" list="connection-types" />
          <datalist id="connection-types">
            <option v-for="c in CONNECTION_SUGGESTIONS" :key="c" :value="c" />
          </datalist>
        </label>

        <label class="adm-label">
          Compatibilidad (separada por comas)
          <input v-model="form.compatibility" class="adm-input" type="text" placeholder="PC, iPhone, Android" />
        </label>

        <label class="adm-label full">
          Descripción
          <textarea
            v-model="form.description"
            class="adm-input"
            rows="5"
            :aria-invalid="!!errors.description"
          />
          <p v-if="errors.description" class="adm-error">{{ errors.description }}</p>
        </label>
      </fieldset>

      <fieldset class="adm-card grid">
        <legend class="legend">Precio y estado</legend>

        <label class="adm-label">
          Precio normal
          <input
            v-model="form.price"
            class="adm-input"
            type="number"
            min="0"
            step="0.01"
            :aria-invalid="!!errors.price"
          />
          <p v-if="errors.price" class="adm-error">{{ errors.price }}</p>
        </label>

        <label class="adm-label">
          Precio de oferta (opcional)
          <input
            v-model="form.offer_price"
            class="adm-input"
            type="number"
            min="0"
            step="0.01"
            :aria-invalid="!!errors.offer_price"
          />
          <p v-if="errors.offer_price" class="adm-error">{{ errors.offer_price }}</p>
        </label>

        <label class="check">
          <input v-model="form.is_bundle" type="checkbox" />
          Es un Starter Pack (kit)
        </label>

        <label class="check">
          <input v-model="form.active" type="checkbox" />
          Visible en la tienda
        </label>
      </fieldset>

      <fieldset class="adm-card">
        <legend class="legend">Variantes y stock</legend>
        <p class="hint">Si el producto no tiene versiones, dejá una sola variante llamada «Único».</p>

        <ul class="rows">
          <li v-for="(v, i) in form.variants" :key="v.id ?? `new-${i}`" class="row">
            <label class="adm-label">
              Nombre
              <input
                v-model="v.name"
                class="adm-input"
                type="text"
                :aria-invalid="!!errors.variants?.[i]?.name"
              />
              <p v-if="errors.variants?.[i]?.name" class="adm-error">{{ errors.variants[i].name }}</p>
            </label>
            <label class="adm-label">
              SKU
              <input
                v-model="v.sku"
                class="adm-input"
                type="text"
                :aria-invalid="!!errors.variants?.[i]?.sku"
              />
              <p v-if="errors.variants?.[i]?.sku" class="adm-error">{{ errors.variants[i].sku }}</p>
            </label>
            <label class="adm-label">
              Stock
              <input
                v-model="v.stock"
                class="adm-input"
                type="number"
                min="0"
                step="1"
                :aria-invalid="!!errors.variants?.[i]?.stock"
              />
              <p v-if="errors.variants?.[i]?.stock" class="adm-error">{{ errors.variants[i].stock }}</p>
            </label>
            <button
              type="button"
              class="adm-btn adm-btn--danger row__remove"
              :disabled="form.variants.length === 1"
              @click="removeVariant(i)"
            >
              Quitar variante
            </button>
          </li>
        </ul>

        <button type="button" class="adm-btn" @click="addVariant">Agregar variante</button>
      </fieldset>

      <fieldset class="adm-card">
        <legend class="legend">Ficha técnica</legend>
        <p v-if="errors.specs" class="adm-error">{{ errors.specs }}</p>

        <ul class="rows">
          <li v-for="(s, i) in form.specs" :key="i" class="row row--spec">
            <label class="adm-label">
              Dato
              <input v-model="s.key" class="adm-input" type="text" placeholder="Potencia" />
            </label>
            <label class="adm-label">
              Valor
              <input v-model="s.value" class="adm-input" type="text" placeholder="18 W" />
            </label>
            <button type="button" class="adm-btn adm-btn--danger row__remove" @click="removeSpec(i)">
              Quitar dato
            </button>
          </li>
        </ul>

        <button type="button" class="adm-btn" @click="addSpec">Agregar dato</button>
      </fieldset>

      <fieldset class="adm-card">
        <legend class="legend">Imágenes</legend>
        <p class="hint">JPG, PNG o WebP de hasta 2 MB. La primera es la imagen principal.</p>

        <ul v-if="form.images.length" class="previews">
          <li v-for="(url, i) in form.images" :key="url" class="preview">
            <img :src="url" :alt="`Imagen ${i + 1} del producto`" />
            <button type="button" class="adm-btn adm-btn--danger" @click="removeImage(i)">Quitar</button>
          </li>
        </ul>

        <label class="adm-label upload">
          Subir imágenes
          <input
            class="adm-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            :disabled="uploading"
            @change="onFilesSelected"
          />
        </label>
        <p v-if="uploading" class="hint" role="status">Subiendo imágenes…</p>
      </fieldset>

      <div class="submit">
        <BaseButton type="submit" :disabled="submitting || uploading">
          {{ submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto' }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form {
  display: grid;
  gap: 1rem;
}

fieldset {
  margin: 0;
  min-width: 0;
}

.legend {
  padding: 0 0.5rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.hint {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--adm-muted);
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rows {
  display: grid;
  gap: 1rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--adm-border);
}

.row__remove {
  justify-self: start;
  align-self: end;
}

.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
}

.preview {
  display: grid;
  gap: 0.5rem;
  justify-items: center;
}

.preview img {
  width: 7rem;
  height: 7rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--adm-border);
}

.upload {
  max-width: 24rem;
}

.submit {
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }

  .full {
    grid-column: 1 / -1;
  }

  .row {
    grid-template-columns: 2fr 1.5fr 1fr auto;
  }

  .row--spec {
    grid-template-columns: 1fr 1fr auto;
  }
}
</style>
