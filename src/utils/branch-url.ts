import { BRANCH } from '@/constants/site.constant';

export function withBranch(href: string, code: string | null | undefined) {
  const [path, hash] = href.split('#');
  const [pathname, search] = path.split('?');
  const params = new URLSearchParams(search);
  if (code != null) params.set(BRANCH.PARAM, code);
  else params.delete(BRANCH.PARAM);
  return `${pathname}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
