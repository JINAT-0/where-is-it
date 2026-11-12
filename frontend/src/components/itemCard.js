import { resolveAssetUrl } from '../js/api.js';
import { escapeHtml, formatDate, renderBadge, truncate } from '../js/utils.js';

export function renderItemCard(item) {
  const imgUrl = item.image_path ? resolveAssetUrl(item.image_path) : '';
  const typeColor = item.report_type === 'LOST' ? 'text-danger' : 'text-primary';

  return `
    <article class="card overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow duration-200 group">
      <a href="/items/${item.id}" data-link class="block relative aspect-[16/10] bg-slate-100 overflow-hidden">
        ${imgUrl
      ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.item_name)}" class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />`
      : `<div class="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                <svg class="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-xs font-medium">No Image Provided</span>
              </div>`
    }
        <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
          ${renderBadge(item.report_type)}
          ${renderBadge(item.resolution_status)}
        </div>
      </a>

      <div class="p-5 flex-1 flex flex-col">
        <div class="flex items-center justify-between gap-2 text-xs font-medium text-muted mb-1.5">
          <span class="${typeColor} font-semibold">${escapeHtml(item.category_name)}</span>
          <span>${formatDate(item.event_date)}</span>
        </div>

        <h3 class="text-base font-bold text-dark leading-snug line-clamp-1">
          <a href="/items/${item.id}" data-link class="hover:text-primary transition">${escapeHtml(item.item_name)}</a>
        </h3>

        <p class="mt-2 text-sm text-muted line-clamp-2 flex-1">
          ${escapeHtml(truncate(item.description, 105))}
        </p>

        <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 text-xs text-slate-600 truncate">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="truncate">${escapeHtml(item.location)}</span>
          </span>
          <a href="/items/${item.id}" data-link class="text-xs font-semibold text-primary hover:text-primary-700 shrink-0">
            View Details &rarr;
          </a>
        </div>
      </div>
    </article>
  `;
}
