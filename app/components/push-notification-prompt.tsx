import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Form, useSubmit } from "react-router";

function PushNotificationPrompt() {
  const submit = useSubmit();
  const [showPrompt, setShowPrompt] = useState(false);

  const registerServiceWorker = async () => {
    const register = await navigator.serviceWorker.register("./worker.js", {
      scope: "/",
    });

    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.PUBLIC_PUSH_NOTIFICATION_VAPID_KEY,
    });

    submit(
      { subscription: JSON.stringify(subscription) },
      { method: "post", action: "/" }
    );
  };

  useEffect(() => {
    setShowPrompt(Notification.permission === "default");
  }, []);

  return (
    showPrompt && (
      <section className="fixed bottom-0 inset-x-0 sm:bottom-4 sm:inset-x-auto sm:right-4 z-50 max-w-full sm:max-w-sm w-full sm:mx-auto px-4 pb-4">
        <Form method="post" hidden>
          <input type="hidden" name="subscription" />
        </Form>
        <Card className="shadow-xl border border-primary bg-background rounded-t-xl sm:rounded-xl sm:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm ">Stay Updated</CardTitle>
            <CardDescription className="text-sm">
              Get notified when exchange rates update and stay in the loop
              instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-start sm:gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto border border-primary"
              onClick={() => {
                Notification.requestPermission().then((response) => {
                  if (response === "granted") {
                    registerServiceWorker().catch(console.error);
                    setShowPrompt(false);
                  }
                });
              }}
            >
              Yes, Notify Me
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowPrompt(false);
              }}
            >
              No Thanks
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  );
}

export default PushNotificationPrompt;
