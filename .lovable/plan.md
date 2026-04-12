

## Fix Failing Earth Intelligence / TerraStream Layers

### Root Cause
Multiple NASA GIBS layer names in the codebase are **incorrect** -- they don't exist in the GIBS catalog. This causes 400 errors on every tile request, making the layers appear broken. Additionally, the default monthly date may be too recent for some products.

### Incorrect Layer Names (verified against GIBS WMTS Capabilities)

| Current (broken) | Correct (from GIBS catalog) |
|---|---|
| `MODIS_Terra_NDVI_16Day` | `MODIS_Terra_NDVI_8Day` |
| `SMAP_L3_Soil_Moisture_Passive_Day` / `Night` | `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture` (single layer, no day/night) |
| `MODIS_Terra_Water_Composite` | `MODIS_Combined_Flood_3-Day` |
| `MODIS_Terra_Aerosol_Optical_Depth_047` | `MODIS_Terra_Aerosol_Optical_Depth_3km` |

### Layers That Are Correct (no changes needed)
- `MODIS_Terra_Land_Surface_Temp_Day` / `Night`
- `GHRSST_L4_MUR_Sea_Surface_Temperature`
- `IMERG_Precipitation_Rate`
- `VIIRS_SNPP_CorrectedReflectance_TrueColor`
- `VIIRS_Black_Marble`
- `MODIS_Terra_NDSI_Snow_Cover`
- `VIIRS_SNPP_Thermal_Anomalies_375m_Day` / `Night`
- `CERES_Combined_TOA_Shortwave_Flux_All_Sky_Monthly`

### Changes (single file: `src/hooks/useEarthIntelligence.ts`)

1. **Fix NDVI layer** (line ~426): Change `MODIS_Terra_NDVI_16Day` to `MODIS_Terra_NDVI_8Day`

2. **Fix Soil Moisture layer** (line ~405-406): Change `SMAP_L3_Soil_Moisture_Passive_Day` / `Night` to `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture` (remove day/night variant since this layer has no day/night split)

3. **Fix Surface Water / Flood layer** (line ~520): Change `MODIS_Terra_Water_Composite` to `MODIS_Combined_Flood_3-Day`

4. **Fix Aerosol layer** (line ~483): Change `MODIS_Terra_Aerosol_Optical_Depth_047` to `MODIS_Terra_Aerosol_Optical_Depth_3km`

5. **Increase monthly date buffer** (line ~1009): Change from 2 months back to 4 months back to ensure data availability for slower-updating products

6. **Add silent error handling** for tile load errors to prevent console spam from occasional 400s on edge dates

