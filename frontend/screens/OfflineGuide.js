import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Search, BookOpen, ChevronRight } from 'lucide-react-native';

const EMERGENCY_DATA = [
  { id: '1', title: 'Bleeding Control', tags: 'blood, cut, wound', steps: '1. Apply firm pressure\n2. Elevate limb\n3. Apply tourniquet if severe' },
  { id: '2', title: 'CPR Basics', tags: 'heart, breath, chest', steps: '1. Push hard and fast in center of chest\n2. 100-120 compressions per minute' },
  { id: '3', title: 'Choking (Heimlich)', tags: 'food, throat, airway', steps: '1. 5 back blows\n2. 5 abdominal thrusts\n3. Repeat until clear' },
  { id: '4', title: 'Earthquake', tags: 'shake, building, safety', steps: '1. Drop to floor\n2. Cover head/neck\n3. Hold onto sturdy furniture' },
];

export default function OfflineGuide() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = EMERGENCY_DATA.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search (e.g., 'bleeding', 'heart')"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredData.map(item => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <BookOpen size={20} color="#e63946" />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <ChevronRight size={18} color="#ccc" />
            </View>
            <Text style={styles.cardContent}>{item.steps}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, marginTop: 10 },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, height: 45, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { flex: 1, marginLeft: 10, fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardContent: { fontSize: 14, color: '#666', lineHeight: 20 }
});