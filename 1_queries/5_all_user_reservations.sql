SELECT properties.*, reservations.*, AVG(rating) AS average_rating
FROM reservations
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1 AND end_date < NOW()
GROUP BY reservations.id, properties.id
ORDER BY start_date
LIMIT 10;