from abc import ABC, abstractmethod

class Strategy(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def execute(self, image):
        pass
