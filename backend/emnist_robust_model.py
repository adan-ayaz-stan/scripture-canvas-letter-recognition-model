# -*- coding: utf-8 -*-
"""emnist_robust_model.ipynb
Robust CNN for EMNIST Letter Classification
"""

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import tensorflow_datasets as tfds
import matplotlib.pyplot as plt
import numpy as np

print("🚀 Loading EMNIST Letters dataset...")
dataset, info = tfds.load('emnist/letters', with_info=True, as_supervised=True)
train_dataset = dataset['train']
test_dataset = dataset['test']

IMG_SIZE = 28
BATCH_SIZE = 64
num_classes = 26 # A-Z
class_names = [chr(i) for i in range(65, 91)]

def preprocess(image, label):
    image = tf.transpose(image, perm=[1, 0, 2])
    image = tf.image.rot90(image, k=0)
    
    image = tf.cast(image, tf.float32) / 255.0
    label = label - 1
    return image, label

train_ds = train_dataset.map(preprocess).shuffle(10000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
test_ds = test_dataset.map(preprocess).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

val_size = int(0.5 * info.splits['test'].num_examples)
val_ds = test_ds.take(val_size // BATCH_SIZE)
test_ds = test_ds.skip(val_size // BATCH_SIZE)

data_augmentation = tf.keras.Sequential([
    layers.RandomRotation(0.1), 
    layers.RandomZoom(0.1),      
    layers.RandomTranslation(0.1, 0.1), 
], name="data_augmentation")

model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),
    
    data_augmentation,

    layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(pool_size=(2, 2)),
    layers.Dropout(0.2),

    layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.Conv2D(64, (3, 3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(pool_size=(2, 2)),
    layers.Dropout(0.3),

    layers.Conv2D(128, (3, 3), padding='same', activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D(pool_size=(2, 2)),
    layers.Dropout(0.4),

    layers.Flatten(),
    layers.Dense(256, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    layers.Dense(num_classes, activation='softmax')
])

model.summary()

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

early_stopping = callbacks.EarlyStopping(
    monitor='val_loss',
    patience=6,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = callbacks.ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.2,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

print("🚀 Starting training with callbacks...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=50,
    callbacks=[early_stopping, reduce_lr],
    verbose=1
)

print("\n📊 Evaluating on unseen test data...")
test_loss, test_acc = model.evaluate(test_ds, verbose=1)
print(f"✅ Robust Model Test Accuracy: {test_acc*100:.2f}%")

model.save('emnist_letter_model_robust.h5')
print("✅ Robust model saved as 'emnist_letter_model_robust.h5'")

plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Training Acc')
plt.plot(history.history['val_accuracy'], label='Val Acc')
plt.title('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Loss')
plt.legend()
plt.show()
