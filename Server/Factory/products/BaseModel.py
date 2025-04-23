from abc import ABC, abstractmethod

class BaseModel(ABC):
    @abstractmethod
    def predict(self, image):
        pass

    def preprocess(self, image):
        return image

    def train(self, data_loader, epochs=1):
        raise NotImplementedError(f"Training is not implemented for {self.__class__.__name__}")

    def evaluate(self, val_loader):
        raise NotImplementedError(f"Evaluation is not implemented for {self.__class__.__name__}")
