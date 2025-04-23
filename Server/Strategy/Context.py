from Strategy.Strategy import Strategy


class Context:
    def __init__(self, strategy: Strategy):
        self._strategy = strategy

    def set_strategy(self, strategy: Strategy):
        self._strategy = strategy

    def execute(self, image):
        return self._strategy.execute(image)
