export class RedPerformance {
	private perfStart = Date.now();
	private perfEnd = 0;

	public end() {
		this.perfEnd = Date.now();
		return this;
	}

	public getSeconds(): number {
		let timeTaken = this.perfEnd - this.perfStart;
		return Math.round(timeTaken / 100) / 10;
	}
}
