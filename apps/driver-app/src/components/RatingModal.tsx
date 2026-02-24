import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ActivityIndicator, Alert
} from 'react-native';
import { rateClient } from '../api/api';

interface Props {
    visible: boolean;
    onClose: () => void;
    jobId: string;
    clientName: string;
}

export default function RatingModal({ visible, onClose, jobId, clientName }: Props) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) { Alert.alert('Error', 'Please select a rating'); return; }
        setLoading(true);
        try {
            const res = await rateClient(jobId, rating, comment);
            if (res.success) {
                Alert.alert('Success', 'Rating submitted!');
                onClose();
            }
        } catch (err: any) {
            Alert.alert('Error', 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Rate {clientName}</Text>
                    <Text style={styles.sub}>How was your experience with this rider?</Text>

                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                <Text style={[styles.star, rating >= s && styles.starActive]}>★</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Any comments? (Optional)"
                        placeholderTextColor="#64748b"
                        multiline
                        value={comment}
                        onChangeText={setComment}
                    />

                    <View style={styles.btns}>
                        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
                            <Text style={styles.cancelText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.submit]} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
    sub: { fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 20 },
    stars: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    star: { fontSize: 40, color: '#334155' },
    starActive: { color: '#fbbf24' },
    input: {
        width: '100%', height: 100, backgroundColor: '#0f172a',
        borderRadius: 16, padding: 15, color: '#f1f5f9',
        textAlignVertical: 'top', marginBottom: 20
    },
    btns: { flexDirection: 'row', gap: 12, width: '100%' },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancel: { backgroundColor: '#334155' },
    submit: { backgroundColor: '#7c3aed' },
    cancelText: { color: '#94a3b8', fontWeight: '700' },
    btnText: { color: '#fff', fontWeight: '700' },
});
