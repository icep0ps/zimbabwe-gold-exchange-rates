import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_middleware: true,
  },
  ssr: false,
} satisfies Config;
