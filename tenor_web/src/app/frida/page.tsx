"use client";

import { api } from "~/trpc/react";

export default function Page() {
    // CUANDO ES QUERY que el usuario puede meter data UTILIZAR useMutation en lugar de useQuery.
    const {data, isLoading} = api.frida.generateREQ.useQuery("App de citas para mascotas");

    return (
        <div>
        <h1>FRIDA</h1>
        <p>{isLoading? "Loading..." : data.response.candidates[0].content.parts[0].text}</p>
        </div>
    );
}

