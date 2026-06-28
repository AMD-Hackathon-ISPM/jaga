from __future__ import annotations

from dataclasses import dataclass
from collections.abc import Callable, Sequence

import numpy as np
import pennylane as qml


SUPPORTED_PCA_DIMS = {2, 4, 8}


@dataclass(frozen=True)
class QuantumDeviceInfo:
    name: str
    wires: int
    shots: int | None


class QuantumKernel:
    def __init__(
        self,
        n_wires: int,
        n_layers: int,
        shots: int | None = None,
        preferred_devices: Sequence[str] | None = None,
    ) -> None:
        if n_wires not in SUPPORTED_PCA_DIMS:
            supported = ', '.join(str(value) for value in sorted(SUPPORTED_PCA_DIMS))
            raise ValueError(f'Unsupported pca_dim {n_wires}. Supported values: {supported}')
        if n_layers < 1:
            raise ValueError('n_layers must be at least 1.')
        self.n_wires = n_wires
        self.n_layers = n_layers
        self.shots = shots
        self.device = self._build_device(preferred_devices)
        self.device_info = QuantumDeviceInfo(
            name=str(getattr(self.device, 'short_name', getattr(self.device, 'name', type(self.device).__name__))),
            wires=self.n_wires,
            shots=self.shots,
        )
        self._kernel_circuit = self._build_kernel_circuit()

    def _build_device(self, preferred_devices: Sequence[str] | None = None) -> qml.devices.Device:
        candidates = list(preferred_devices or ('lightning.gpu', 'lightning.qubit', 'default.qubit'))
        last_error: Exception | None = None
        for name in candidates:
            try:
                if self.shots is None:
                    return qml.device(name, wires=self.n_wires)
                return qml.device(name, wires=self.n_wires, shots=self.shots)
            except Exception as error:
                last_error = error
        raise RuntimeError(f'Unable to initialize a PennyLane simulator device from {candidates}.') from last_error

    def _feature_map(self, features: np.ndarray) -> None:
        wires = tuple(range(self.n_wires))
        qml.AngleEmbedding(features, wires=wires, rotation='Y')
        for layer_index in range(self.n_layers):
            scale = float(layer_index + 1)
            for wire_index in wires:
                qml.RZ(scale * features[wire_index], wires=wire_index)
            if self.n_wires > 1:
                for wire_index in range(self.n_wires - 1):
                    qml.CNOT(wires=[wire_index, wire_index + 1])
                qml.CNOT(wires=[self.n_wires - 1, 0])
            for wire_index in wires:
                qml.RY(scale * features[wire_index], wires=wire_index)

    def _build_kernel_circuit(self) -> Callable[[np.ndarray, np.ndarray], np.ndarray]:
        @qml.qnode(self.device)
        def circuit(left: np.ndarray, right: np.ndarray) -> np.ndarray:
            self._feature_map(left)
            qml.adjoint(self._feature_map)(right)
            return qml.probs(wires=range(self.n_wires))

        return circuit

    def evaluate_pair(self, left: np.ndarray, right: np.ndarray) -> float:
        left_array = np.asarray(left, dtype=np.float64)
        right_array = np.asarray(right, dtype=np.float64)
        if left_array.shape != (self.n_wires,) or right_array.shape != (self.n_wires,):
            raise ValueError(
                f'Quantum kernel inputs must have shape ({self.n_wires},). '
                f'Received {left_array.shape} and {right_array.shape}.'
            )
        probabilities = np.asarray(self._kernel_circuit(left_array, right_array), dtype=np.float64)
        return float(np.clip(probabilities[0], 0.0, 1.0))

    def compute_kernel_matrix(self, left: np.ndarray, right: np.ndarray | None = None) -> np.ndarray:
        left_array = np.asarray(left, dtype=np.float64)
        if left_array.ndim != 2 or left_array.shape[1] != self.n_wires:
            raise ValueError(
                f'Left feature matrix must have shape (n_samples, {self.n_wires}). '
                f'Received {left_array.shape}.'
            )
        if right is None:
            return self._compute_symmetric_kernel_matrix(left_array)
        right_array = np.asarray(right, dtype=np.float64)
        if right_array.ndim != 2 or right_array.shape[1] != self.n_wires:
            raise ValueError(
                f'Right feature matrix must have shape (n_samples, {self.n_wires}). '
                f'Received {right_array.shape}.'
            )
        kernel = np.zeros((left_array.shape[0], right_array.shape[0]), dtype=np.float64)
        for row_index, left_features in enumerate(left_array):
            for column_index, right_features in enumerate(right_array):
                kernel[row_index, column_index] = self.evaluate_pair(left_features, right_features)
        return kernel

    def _compute_symmetric_kernel_matrix(self, features: np.ndarray) -> np.ndarray:
        sample_count = features.shape[0]
        kernel = np.zeros((sample_count, sample_count), dtype=np.float64)
        for row_index in range(sample_count):
            kernel[row_index, row_index] = 1.0
            for column_index in range(row_index + 1, sample_count):
                value = self.evaluate_pair(features[row_index], features[column_index])
                kernel[row_index, column_index] = value
                kernel[column_index, row_index] = value
        return kernel
