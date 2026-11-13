// 소유자 화면(/admin#k=…). 토큰은 주소의 # 뒤에서 한 번 읽어 이 탭에만 보관하고 주소에서는 지운다.
// 헤더에는 encodeURIComponent 로 싣는다: 한글 비밀번호는 헤더 값에 그대로 못 넣는다(Worker 의 bearerToken 이 되돌린다).
import { api } from "./api";

const KEY = "owner.token";

export function ownerToken(): string {
  const m = location.hash.match(/k=([^&]+)/);
  if (m) {
    sessionStorage.setItem(KEY, decodeURIComponent(m[1]));
    history.replaceState(null, "", location.pathname + location.search);
  }
  return sessionStorage.getItem(KEY) ?? "";
}

export const ownerApi = <T,>(path: string, init: RequestInit = {}) =>
  api<T>(path, { ...init, headers: { authorization: `Bearer ${encodeURIComponent(ownerToken())}`, ...(init.headers ?? {}) } });

export async function downloadCsv(path: string, filename: string) {
  const r = await fetch(path, { headers: { authorization: `Bearer ${encodeURIComponent(ownerToken())}` } });
  if (!r.ok) throw new Error("내려받지 못했어요");
  const url = URL.createObjectURL(await r.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
