const SCALER_OFFSET: [f32; 3] = [40.697_517, 161.181_84, 57.494_19];
const SCALER_SCALE: [f32; 3] = [0.065_269_64, 0.113_091_39, 0.071_520_59];

const SEX_CATEGORIES: [&str; 2] = ["Female", "Male"];
const COUNTRY_CATEGORIES: [&str; 7] = ["IN", "MG", "PH", "SA", "TZ", "UG", "VN"];

pub const DEMO_FEATURE_LEN: usize = 12;

pub fn demographicFeatures(
    ageYears: f32,
    heightCm: f32,
    weightKg: f32,
    sex: &str,
    country: &str,
) -> [f32; DEMO_FEATURE_LEN] {
    let mut out = [0f32; DEMO_FEATURE_LEN];

    out[0] = (ageYears - SCALER_OFFSET[0]) * SCALER_SCALE[0];
    out[1] = (heightCm - SCALER_OFFSET[1]) * SCALER_SCALE[1];
    out[2] = (weightKg - SCALER_OFFSET[2]) * SCALER_SCALE[2];

    if let Some(index) = SEX_CATEGORIES.iter().position(|c| c.eq_ignore_ascii_case(sex)) {
        out[3 + index] = 1.0;
    }

    let countryUpper = country.to_ascii_uppercase();
    if let Some(index) = COUNTRY_CATEGORIES.iter().position(|c| *c == countryUpper) {
        out[5 + index] = 1.0;
    }

    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matchesOnnxReference() {
        let expected = [
            -0.437_145, 1.053_804, 0.551_124, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let got = demographicFeatures(34.0, 170.5, 65.2, "male", "PH");
        for (i, (g, e)) in got.iter().zip(&expected).enumerate() {
            assert!((g - e).abs() < 1e-4, "feature {i}: got {g} want {e}");
        }
    }

    #[test]
    fn unknownCategoriesAreZero() {
        let got = demographicFeatures(30.0, 160.0, 55.0, "unknown", "ZZ");
        assert_eq!(got[3], 0.0);
        assert_eq!(got[4], 0.0);
        for value in &got[5..12] {
            assert_eq!(*value, 0.0);
        }
    }
}
