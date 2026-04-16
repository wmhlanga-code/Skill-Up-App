import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Review } from '../types';

interface ReviewsListProps {
  reviews: Review[];
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const { colors } = useTheme();

  if (reviews.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        No reviews yet. Be the first!
      </Text>
    );
  }

  return (
    <View>
      {reviews.map((review) => {
        const reviewer = review.reviewer as Record<string, unknown> | undefined;
        return (
          <View
            key={review.id}
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <View style={styles.header}>
              {reviewer?.avatar_url ? (
                <Image
                  source={{ uri: reviewer.avatar_url as string }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.avatarLetter}>
                    {((reviewer?.full_name as string) ?? 'A')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>
                  {(reviewer?.full_name as string) ?? 'Anonymous'}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={[styles.stars, { color: '#F59E0B' }]}>
                    {renderStars(review.rating)}
                  </Text>
                  <Text style={[styles.ago, { color: colors.textMuted }]}>
                    {timeAgo(review.created_at)}
                  </Text>
                </View>
              </View>
            </View>
            {review.comment ? (
              <Text style={[styles.comment, { color: colors.textPrimary }]}>
                {review.comment}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: { fontSize: 16, fontWeight: '700', color: '#2B9EE8' },
  headerInfo: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { fontSize: 13 },
  ago: { fontSize: 12 },
  comment: { fontSize: 14, lineHeight: 20 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
