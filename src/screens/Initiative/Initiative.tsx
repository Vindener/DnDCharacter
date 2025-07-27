import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, PanResponder, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/context/Theme-store';
import TextInput from '@/shared/components/TextInput/TextInput';
import { getStyles } from './style';

interface InitiativeItem {
  id: string;
  name: string;
  roll: string;
}

const Initiative: React.FC = () => {
  const [items, setItems] = useState<InitiativeItem[]>([{ id: Date.now().toString(), name: '', roll: '' }]);
  const draggingIndex = useRef<number | null>(null);
  const startIndexRef = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;
  const ITEM_HEIGHT = 56;
  const [isDragging, setIsDragging] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isDragging,
      onPanResponderMove: (_e, gesture) => {
        pan.setValue(gesture.dy);
        const currentIndex = startIndexRef.current + Math.round(gesture.dy / ITEM_HEIGHT);
        const newIndex = Math.max(0, Math.min(items.length - 1, currentIndex));
        if (draggingIndex.current !== null && newIndex !== draggingIndex.current) {
          reorder(draggingIndex.current, newIndex);
          draggingIndex.current = newIndex;
        }
      },
      onPanResponderRelease: () => {
        pan.setValue(0);
        draggingIndex.current = null;
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        pan.setValue(0);
        draggingIndex.current = null;
        setIsDragging(false);
      },
    }),
  ).current;

  const handleLongPress = (index: number, e: GestureResponderEvent) => {
    if (isDragging) return;
    startIndexRef.current = index;
    draggingIndex.current = index;
    setIsDragging(true);
    pan.setValue(0);
  };

   const moveUp = (index: number) => {
     if (index === 0) return;
     const newItems = [...items];
     [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
     setItems(newItems);
   };

   const moveDown = (index: number) => {
     if (index === items.length - 1) return;
     const newItems = [...items];
     [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
     setItems(newItems);
   };


  const handleAdd = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), name: '', roll: '' }]);
  };

  const handleChange = (index: number, key: keyof InitiativeItem, value: string) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  const renderItem = ({ item, index }: { item: InitiativeItem; index: number }) => {
    const dragging = isDragging && index === draggingIndex.current;
    return (
      <Animated.View
        style={[
          styles.row,
          dragging && {
            zIndex: 1,
            transform: [{ translateY: pan }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 5,
          },
        ]}
        {...(dragging ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity activeOpacity={1} onLongPress={(e) => handleLongPress(index, e)} style={styles.rowContent}>
          <Text style={styles.order}>{index + 1}.</Text>
          <TextInput style={styles.inputName} value={item.name} onChangeText={(t) => handleChange(index, 'name', t)} placeholder="Ім'я" />
          <TextInput
            style={styles.inputRoll}
            value={item.roll}
            onChangeText={(t) => handleChange(index, 'roll', t)}
            placeholder='Куб'
            keyboardType='numeric'
          />
          <View style={styles.moveButtons}>
            <TouchableOpacity onPress={() => moveUp(index)} disabled={index === 0}>
              <Ionicons name='arrow-up' size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveDown(index)} disabled={index === items.length - 1} style={{ marginLeft: 4 }}>
              <Ionicons name='arrow-down' size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={items} keyExtractor={(item) => item.id} renderItem={renderItem} />
      <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
        <Ionicons name='add-circle-outline' size={28} color='#28a745' />
        <Text style={styles.addText}>Додати ще</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Initiative;
