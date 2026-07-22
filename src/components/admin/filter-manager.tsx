"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { friendlyError } from "@/lib/client-errors";

type Make = { id: string; name: string };
type Model = { id: string; name: string; make_id: string };

export function FilterManager() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMakes = async () => {
    const res = await fetch("/api/admin/car-makes", { cache: "no-store" });
    const payload = (await res.json()) as { data?: Make[]; message?: string };
    if (!res.ok) throw new Error(payload.message || "Failed to load makes");
    setMakes(payload.data ?? []);
  };

  const loadModels = async (makeId: string) => {
    if (!makeId) {
      setModels([]);
      return;
    }
    const res = await fetch(`/api/admin/car-models?makeId=${makeId}`, {
      cache: "no-store",
    });
    const payload = (await res.json()) as { data?: Model[]; message?: string };
    if (!res.ok) throw new Error(payload.message || "Failed to load models");
    setModels(payload.data ?? []);
  };

  useEffect(() => {
    setLoading(true);
    loadMakes()
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadModels(selectedMake).catch((err) => setError(friendlyError(err)));
  }, [selectedMake]);

  const addMake = async () => {
    if (!makeName.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/car-makes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: makeName.trim() }),
    });
    const payload = (await res.json()) as { data?: Make; message?: string };
    if (!res.ok) {
      setError(payload.message || "Failed to add make");
      return;
    }
    setMakeName("");
    await loadMakes();
  };

  const addModel = async () => {
    if (!modelName.trim() || !selectedMake) return;
    setError(null);
    const res = await fetch("/api/admin/car-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName.trim(), makeId: selectedMake }),
    });
    const payload = (await res.json()) as { data?: Model; message?: string };
    if (!res.ok) {
      setError(payload.message || "Failed to add model");
      return;
    }
    setModelName("");
    await loadModels(selectedMake);
  };

  const deleteMake = async (id: string) => {
    const res = await fetch("/api/admin/car-makes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.message || "Failed to delete make");
      return;
    }
    if (selectedMake === id) setSelectedMake("");
    await loadMakes();
  };

  const deleteModel = async (id: string) => {
    const res = await fetch("/api/admin/car-models", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.message || "Failed to delete model");
      return;
    }
    await loadModels(selectedMake);
  };

  const makesById = useMemo(
    () => new Map(makes.map((m) => [m.id, m])),
    [makes],
  );

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-gray-600">Loading filters...</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm font-semibold text-foreground">Car makes</p>
          <div className="flex gap-2">
            <Input
              value={makeName}
              onChange={(e) => setMakeName(e.target.value)}
              placeholder="e.g. Toyota"
            />
            <Button onClick={addMake}>Add</Button>
          </div>
          <div className="space-y-2">
            {makes.length === 0 ? (
              <p className="text-xs text-gray-600">No makes yet.</p>
            ) : (
              makes.map((make) => (
                <div
                  key={make.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{make.name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => deleteMake(make.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-white p-4 shadow-soft">
          <p className="text-sm font-semibold text-foreground">Car models</p>
          <Select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
          >
            <option value="">Select make</option>
            {makes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. Corolla"
              disabled={!selectedMake}
            />
            <Button onClick={addModel} disabled={!selectedMake}>
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {selectedMake ? (
              models.length === 0 ? (
                <p className="text-xs text-gray-600">No models yet.</p>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {makesById.get(model.make_id)?.name ?? "Make"}{" "}
                      {model.name}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600"
                      onClick={() => deleteModel(model.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )
            ) : (
              <p className="text-xs text-gray-600">
                Select a make to manage models.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
