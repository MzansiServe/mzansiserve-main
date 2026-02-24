import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, ActivityIndicator, Alert, TextInput, ScrollView
} from 'react-native';
import { getShopProducts } from '../api/api';
import { addToCart } from './CartScreen';
import LoadingScreen from '../components/LoadingScreen';

export default function ShopScreen() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        try {
            const res = await getShopProducts();
            if (res.success) setProducts(res.data?.products || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const renderProduct = ({ item }: any) => (
        <View style={styles.productCard}>
            <View style={styles.imageBox}>
                <Image
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' }}
                    style={styles.productImage}
                />
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>New</Text>
                </View>
            </View>
            <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>{item.description || 'Premium quality essential product from MzansiShop.'}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>R{item.price.toFixed(2)}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (loading && products.length === 0) return <LoadingScreen message="Curating premium products..." />;

    const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <View style={styles.outer}>
            <View style={styles.header}>
                <Text style={styles.title}>MzansiShop</Text>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search our collection..."
                        placeholderTextColor="#64748b"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item: any) => item.id}
                renderItem={renderProduct}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No items match your curation.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#0f172a' },
    header: { padding: 24, paddingTop: 60, backgroundColor: '#1e293b88' },
    title: { fontSize: 26, fontWeight: '900', color: '#f8fafc', marginBottom: 20, letterSpacing: -1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#334155' },
    searchIcon: { marginRight: 10, fontSize: 16 },
    searchInput: { flex: 1, height: 50, color: '#f1f5f9', fontSize: 14, fontWeight: '500' },
    listContent: { padding: 16, paddingBottom: 40 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
    productCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
    imageBox: { width: '100%', height: 160, backgroundColor: '#0f172a' },
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    badge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#7c3aed', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    productDetails: { padding: 14 },
    productName: { color: '#f8fafc', fontWeight: '800', fontSize: 15 },
    productDescription: { color: '#64748b', fontSize: 11, marginTop: 4, lineHeight: 15, height: 30 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    productPrice: { color: '#fff', fontSize: 16, fontWeight: '900' },
    addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    empty: { padding: 60, alignItems: 'center' },
    emptyText: { color: '#475569', fontSize: 14, fontWeight: '600' }
});
