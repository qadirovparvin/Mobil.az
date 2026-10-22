const translations = {
    az: {
        notifications: {
            ad_status_active_title: 'Elan təsdiqləndi',
            ad_status_active_body: '"{brand} {model}" elanınız artıq saytda görünür.',
            ad_status_rejected_title: 'Elan rədd edildi',
            ad_status_rejected_body: '"{brand} {model}" elanınız moderasiyadan keçmədi.',
            ad_status_archived_title: 'Elan arxivləşdirildi',
            ad_status_archived_body: '"{brand} {model}" elanınız arxivə göndərildi.',
            ad_status_sold_title: 'Elan satılmış kimi işarələndi',
            ad_status_sold_body: '"{brand} {model}" elanınız satılmış kimi yeniləndi.',
            package_expired_title: 'Paket müddəti bitdi',
            package_expired_body: 'Mağazanızın "{package}" paketinin müddəti bitdi. Lütfən yeniləyin.',
            promo_expired_title: 'Promo müddəti bitdi',
            promo_expired_body: '"{brand} {model}" elanınızın promo müddəti bitdi.',
            new_review_title: 'Yeni rəy',
            new_review_body: 'Kimsə sizə {rating} ulduzlu rəy yazdı.',
            wallet_recharge_title: 'Balans artırıldı',
            wallet_recharge_body: 'Balansınız {amount} AZN artırıldı.',
        }
    },
    en: {
        notifications: {
            ad_status_active_title: 'Ad Approved',
            ad_status_active_body: 'Your ad "{brand} {model}" is now live.',
            ad_status_rejected_title: 'Ad Rejected',
            ad_status_rejected_body: 'Your ad "{brand} {model}" did not pass moderation.',
            ad_status_archived_title: 'Ad Archived',
            ad_status_archived_body: 'Your ad "{brand} {model}" has been archived.',
            ad_status_sold_title: 'Ad Marked as Sold',
            ad_status_sold_body: 'Your ad "{brand} {model}" is now marked as sold.',
            package_expired_title: 'Package Expired',
            package_expired_body: 'Your store package "{package}" has expired. Please renew.',
            promo_expired_title: 'Promo Expired',
            promo_expired_body: 'The promo for your ad "{brand} {model}" has expired.',
            new_review_title: 'New Review',
            new_review_body: 'Someone left you a {rating} star review.',
            wallet_recharge_title: 'Wallet Recharged',
            wallet_recharge_body: 'Your wallet has been recharged by {amount} AZN.',
        }
    },
    ru: {
        notifications: {
            ad_status_active_title: 'Объявление одобрено',
            ad_status_active_body: 'Ваше объявление "{brand} {model}" опубликовано.',
            ad_status_rejected_title: 'Объявление отклонено',
            ad_status_rejected_body: 'Ваше объявление "{brand} {model}" не прошло модерацию.',
            ad_status_archived_title: 'Объявление перенесено в архив',
            ad_status_archived_body: 'Ваше объявление "{brand} {model}" перемещено в архив.',
            ad_status_sold_title: 'Объявление отмечено как проданное',
            ad_status_sold_body: 'Ваше объявление "{brand} {model}" отмечено как проданное.',
            package_expired_title: 'Срок действия пакета истек',
            package_expired_body: 'Срок действия пакета вашего магазина "{package}" истек. Пожалуйста, обновите.',
            promo_expired_title: 'Срок действия промо истек',
            promo_expired_body: 'Срок действия промо для вашего объявления "{brand} {model}" истек.',
            new_review_title: 'Новый отзыв',
            new_review_body: 'Кто-то оставил вам отзыв на {rating} звезд(ы).',
            wallet_recharge_title: 'Баланс пополнен',
            wallet_recharge_body: 'Ваш баланс пополнен на {amount} AZN.',
        }
    }
};

const getTranslation = (lang = 'az', key, params = {}) => {
    // Fallback to 'az' if language is not found
    const dictionary = translations[lang] || translations['az'];
    
    // Key format: "category.item" e.g. "notifications.ad_status_active_title"
    const keys = key.split('.');
    let text = dictionary;
    
    for (const k of keys) {
        if (text[k]) {
            text = text[k];
        } else {
            // Fallback to az string if missing in target language
            text = translations['az'];
            for (const fallbackK of keys) {
                if (text[fallbackK]) {
                    text = text[fallbackK];
                } else {
                    return key; // return the key itself if totally missing
                }
            }
            break;
        }
    }

    if (typeof text !== 'string') return key;

    // Replace parameters like {brand}
    for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
    }

    return text;
};

module.exports = {
    getTranslation,
    translations
};
