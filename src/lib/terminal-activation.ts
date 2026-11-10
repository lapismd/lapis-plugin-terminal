/** Layout callbacks belong to one plugin activation, including pending seeds. */
export class TerminalActivation {
  #generation = 0;
  #pending = new Set<Promise<void>>();
  begin(
    seed: (current: () => boolean) => Promise<void>,
    report: (error: unknown) => void,
  ): () => void {
    const generation = ++this.#generation;
    let started = false;
    return () => {
      if (started || generation !== this.#generation) return;
      started = true;
      const current = () => generation === this.#generation;
      const pending = Promise.resolve().then(async () => {
        if (current()) await seed(current);
      });
      this.#pending.add(pending);
      void pending.then(
        () => this.#pending.delete(pending),
        (error) => {
          this.#pending.delete(pending);
          report(error);
        },
      );
    };
  }
  fence(): void {
    this.#generation++;
  }
  async drain(): Promise<void> {
    await Promise.all([...this.#pending]);
  }
}
