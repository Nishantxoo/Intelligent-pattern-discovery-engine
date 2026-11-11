import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom';

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export function useSearchParams() {
  const [params] = useRouterSearchParams();
  return params;
}

export function useParamsHook() {
  return useParams();
}
