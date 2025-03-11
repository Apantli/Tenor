"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function Page() {
    const [query, setQuery] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");

    const { data, isLoading } = api.frida.generateREQ.useQuery(submittedQuery, { enabled: !!submittedQuery });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedQuery(query);
    };

    return (
        <div>
            <h1>FRIDA - Generador de Requerimientos</h1>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    placeholder="Contexto del desarrollo"
                    className="border p-2 rounded-md"
                />
                <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded-md">
                    Generar
                </button>
            </form>
            <p>{isLoading ? "Cargando..." : data.response.candidates[0].content.parts[0].text}</p>
        </div>
    );
}



