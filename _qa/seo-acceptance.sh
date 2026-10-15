#!/usr/bin/env bash
# Phase 4c acceptance — crawl surfaces + SEO on a live landing page.
B=http://localhost:3002
pass=0; fail=0
chk() { if eval "$2"; then echo "PASS $1"; pass=$((pass+1)); else echo "FAIL $1"; fail=$((fail+1)); fi; }

sleep 4
chk "server up" "[ \$(curl -s -o /dev/null -w '%{http_code}' $B/) = 200 ]"

SM=$(curl -s $B/sitemap.xml)
chk "sitemap has /bhubaneswar" "echo \"\$SM\" | grep -q '<loc>$B/bhubaneswar</loc>' || echo \"\$SM\" | grep -q 'waytero.com/bhubaneswar<'"
chk "sitemap has cab-booking-in-bhubaneswar" "echo \"\$SM\" | grep -q 'cab-booking-in-bhubaneswar'"
chk "sitemap has hotel-booking-in-odisha" "echo \"\$SM\" | grep -q 'hotel-booking-in-odisha'"
chk "sitemap drops /destinations/" "! echo \"\$SM\" | grep -q '/destinations/'"
chk "sitemap drops /hotels/city/" "! echo \"\$SM\" | grep -q '/hotels/city/'"

LL=$(curl -s $B/llms.txt)
chk "llms.txt has City, service & place pages" "echo \"\$LL\" | grep -q 'City, service & place pages'"
chk "llms.txt links hub" "echo \"\$LL\" | grep -q '/bhubaneswar'"
chk "llms.txt drops Destinations advert" "! echo \"\$LL\" | grep -q 'Destinations]'"

RB=$(curl -s $B/robots.txt)
chk "robots mentions sitemap" "echo \"\$RB\" | grep -qi sitemap"

for pair in "/hotels/city/bhubaneswar /hotel-booking-in-bhubaneswar" "/destinations/bhubaneswar /tour-packages-in-bhubaneswar" "/destinations /tours"; do
  set -- $pair
  code=$(curl -s -o /dev/null -w '%{http_code}' "$B$1")
  loc=$(curl -sI "$B$1" | grep -i '^location' | tr -d '\r' | awk '{print $2}')
  chk "301 $1 -> $2 (got $code $loc)" "[ $code -ge 300 ] && [ $code -lt 400 ] && [ \"$loc\" = \"$2\" ]"
done

P=$(curl -s $B/hotel-booking-in-bhubaneswar)
chk "canonical absolute" "echo \"\$P\" | grep -q 'rel=\"canonical\" href=\"http://localhost:3002/hotel-booking-in-bhubaneswar\"'"
chk "hreflang en-in" "echo \"\$P\" | grep -qi 'hreflang=\"en-in\"'"
chk "og:title present" "echo \"\$P\" | grep -q 'property=\"og:title\"'"
chk "twitter:card present" "echo \"\$P\" | grep -q 'name=\"twitter:card\"'"
chk "ld+json count >= 3" "[ \$(echo \"\$P\" | grep -o 'application/ld+json' | wc -l) -ge 3 ]"
chk "ld+json has City or Service" "echo \"\$P\" | grep -q '\"@type\":\"City\"\|\"@type\":\"Service\"\|\"@type\": \"City\"\|\"@type\": \"Service\"'"
chk "ld+json BreadcrumbList" "echo \"\$P\" | grep -q 'BreadcrumbList'"
chk "ld+json Organization areaServed" "echo \"\$P\" | grep -q 'areaServed'"
chk "ld+json Organization ImageObject logo" "echo \"\$P\" | grep -q 'ImageObject'"
chk "real price in HTML" "echo \"\$P\" | grep -q '₹4,500'"
chk "no raw enum labels" "! echo \"\$P\" | grep -q 'TEMPO_TRAVELLER'"

CP=$(curl -s $B/cab-booking-in-bhubaneswar)
chk "cab page pretty labels" "echo \"\$CP\" | grep -q 'Tempo Traveller'"
chk "cab page GST note" "echo \"\$CP\" | grep -qi 'GST'"

# ── Place pages (Phase: airport/station cabs) ────────────────────────────────
AIR=/bhubaneswar-biju-patnaik-international-airport-cab
STA=/bhubaneswar-railway-station-cab
chk "airport place 200" "[ \$(curl -s -o /dev/null -w '%{http_code}' $B$AIR) = 200 ]"
chk "station place 200"  "[ \$(curl -s -o /dev/null -w '%{http_code}' $B$STA) = 200 ]"
AP=$(curl -s $B$AIR); SP=$(curl -s $B$STA)
chk "airport JSON-LD @type Airport" "echo \"\$AP\" | grep -q '\"@type\":\"Airport\"\|\"@type\": \"Airport\"'"
chk "station JSON-LD @type TrainStation" "echo \"\$SP\" | grep -q '\"@type\":\"TrainStation\"\|\"@type\": \"TrainStation\"'"
chk "station not mislabelled Airport" "! echo \"\$SP\" | grep -q '\"@type\":\"Airport\"\|\"@type\": \"Airport\"'"
chk "airport canonical" "echo \"\$AP\" | grep -q 'rel=\"canonical\" href=\"$B$AIR\"'"
chk "airport has containedInPlace" "echo \"\$AP\" | grep -q 'containedInPlace'"
chk "airport has OfferCatalog" "echo \"\$AP\" | grep -q 'OfferCatalog'"
chk "sitemap lists both place slugs" "echo \"\$SM\" | grep -q 'international-airport-cab' && echo \"\$SM\" | grep -q 'bhubaneswar-railway-station-cab'"
chk "llms.txt place heading" "echo \"\$LL\" | grep -q 'City, service & place pages'"
chk "llms.txt links places" "echo \"\$LL\" | grep -q 'airport & station cabs'"
chk "home footer Popular Places" "curl -s $B/ | grep -q 'Popular Places'"

# ── Hidden-service 404 policy (manual toggle — see comment) ─────────────────
# Flip HOTEL off at the DB and expect /hotels → 404, then restore:
#   docker exec waytero_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
#     -c "UPDATE service_types SET is_active=false WHERE type_code='\''HOTEL'\''"'
#   sleep 6   # availability revalidate is 300s; a fresh render needs the cache window or a restart
#   then restore is_active=true.
chk "hotels visible while supply>0" "[ \$(curl -s -o /dev/null -w '%{http_code}' $B/hotels) = 200 ]"

echo; echo "RESULT: $pass passed, $fail failed"
[ $fail -eq 0 ]
